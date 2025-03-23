import {
  sendIgoRequest,
  buildXmlRequest,
  buildAgentSection,
  buildVendorSection,
  buildPricingSection,
  handleIgoEvent,
  getEstimatedPrice,
  PRICING_MODELS,
  PAYMENT_POINTS,
  PRICING_FLAGS,
  requestBids,
  checkAvailability,
} from "../services/igoService.js";
import Ride from "../models/Ride.js";
import igoConfig from "../config/igoConfig.js";
import Bid from "../models/Bid.js";

/**
 * Get price estimate for a ride
 */
export const getPriceEstimate = async (req, res) => {
  try {
    const { pickup, dropoff, time, vehicleType } = req.body;

    // Validate required inputs
    if (!pickup || !dropoff || !time) {
      return res.status(400).json({
        message:
          "Missing required fields: pickup, dropoff, and time are required",
      });
    }

    const response = await getEstimatedPrice(
      pickup,
      dropoff,
      time,
      vehicleType
    );
    res.json(response);
  } catch (error) {
    console.error("Price estimation error:", error);
    res.status(500).json({
      message: "Error getting price estimate",
      error: error.message,
    });
  }
};

/**
 * Check ride availability
 */
export const checkRideAvailability = async (req, res) => {
  try {
    const { pickup, dropoff, time, pricingModel, paymentPoint, vehicleType } =
      req.body;

    // Validate required inputs
    if (!pickup || !dropoff || !time) {
      return res.status(400).json({
        message:
          "Missing required fields: pickup, dropoff, and time are required",
      });
    }

    // Use igoConfig functions for consistent XML structure
    const response = await sendIgoRequest(
      igoConfig.buildXmlRequest({
        AgentBookingAvailabilityRequest: {
          Agent: igoConfig.buildAgentSection(),
          Vendor: igoConfig.buildVendorSection(),
          Journey: igoConfig.buildJourneySection({ pickup, dropoff, time }),
          VehicleType: vehicleType || igoConfig.vehicleTypes.STANDARD,
          Pricing: igoConfig.buildPricingSection({
            pricingModel: pricingModel || PRICING_MODELS.UP_FRONT,
            paymentPoint: paymentPoint || PAYMENT_POINTS.TIME_OF_BOOKING,
            flags: [
              PRICING_FLAGS.ALLOW_WAITING_TIME,
              PRICING_FLAGS.ALLOW_EXTRAS,
            ],
          }),
          Notifications: {
            SMS: true,
            Email: true,
          },
        },
      })
    );

    // Store the availability reference in response
    let availabilityReference = null;
    if (
      response.AgentBookingAvailabilityResponse &&
      response.AgentBookingAvailabilityResponse.AvailabilityReference
    ) {
      availabilityReference =
        response.AgentBookingAvailabilityResponse.AvailabilityReference;

      // Add it to the response so client can use it
      response.savedAvailabilityReference = availabilityReference;
    }

    res.json(response);
  } catch (error) {
    console.error("Availability check error:", error);
    res.status(500).json({
      message: "Error checking ride availability",
      error: error.message,
    });
  }
};

/**
 * Book a ride
 */
export const bookRide = async (req, res) => {
  try {
    const {
      userId,
      pickup,
      dropoff,
      time,
      pricingModel,
      paymentPoint,
      price,
      passengerDetails,
      specialInstructions,
      vehicleType,
      availabilityReference,
    } = req.body;

    // Validate required inputs
    if (!pickup || !dropoff || !time || !passengerDetails) {
      return res.status(400).json({
        message: "Missing required fields for booking",
      });
    }

    // Get user ID from authenticated user if not provided
    const userObjectId = req.user?._id || userId;

    // Validate user ID format
    if (
      !userObjectId ||
      (typeof userObjectId === "string" &&
        !userObjectId.match(/^[0-9a-fA-F]{24}$/))
    ) {
      return res.status(400).json({
        message: "Invalid user ID format. Must be a valid MongoDB ObjectId",
      });
    }

    // Ensure at least one passenger is marked as lead
    const hasLeadPassenger = passengerDetails.some((p) => p.isLead === true);
    if (!hasLeadPassenger && passengerDetails.length > 0) {
      passengerDetails[0].isLead = true; // Mark first passenger as lead if none specified
    }

    // Generate a unique booking reference
    const agentBookingReference = igoConfig.generateBookingReference();

    // Create new ride record in database
    const newRide = new Ride({
      user: userObjectId,
      pickupLocation: pickup,
      dropoffLocation: dropoff,
      pickupTime: new Date(time),
      fare: price || 0,
      status: igoConfig.rideStatuses.BOOKED,
      pricingModel: pricingModel || PRICING_MODELS.UP_FRONT,
      paymentPoint: paymentPoint || PAYMENT_POINTS.TIME_OF_BOOKING,
      passengers: passengerDetails,
      specialInstructions: specialInstructions || "",
      vehicleType: vehicleType || igoConfig.vehicleTypes.STANDARD,
      igoAvailabilityReference: availabilityReference,
      bookedAt: new Date(),
    });

    // Save ride to get the _id
    await newRide.save();

    // Use igoConfig functions for consistent XML structure
    const xmlRequest = igoConfig.buildXmlRequest({
      AgentBookingAuthorizationRequest: {
        Agent: igoConfig.buildAgentSection(),
        Vendor: igoConfig.buildVendorSection(),
        AvailabilityReference:
          availabilityReference || `AvailabilityRef_${Date.now()}`,
        AgentBookingReference: agentBookingReference,
        Journey: igoConfig.buildJourneySection({ pickup, dropoff, time }),
        VehicleType: vehicleType || igoConfig.vehicleTypes.STANDARD,
        Pricing: igoConfig.buildPricingSection({
          pricingModel: pricingModel || PRICING_MODELS.UP_FRONT,
          paymentPoint: paymentPoint || PAYMENT_POINTS.TIME_OF_BOOKING,
          price,
          flags: [PRICING_FLAGS.ALLOW_WAITING_TIME, PRICING_FLAGS.ALLOW_EXTRAS],
        }),
        Passengers: igoConfig.buildPassengerSection(passengerDetails),
        DriverNote: specialInstructions || "",
        YourReference: `Booking_${newRide._id}`,
        Notifications: {
          SMS: true,
          Email: true,
        },
      },
    });

    const response = await sendIgoRequest(xmlRequest);

    // Update ride with iGo booking response
    if (response.AgentBookingAuthorizationResponse) {
      const authResponse = response.AgentBookingAuthorizationResponse;

      // Update the booking with the authorization reference
      newRide.igoBookingId = agentBookingReference;
      newRide.igoAuthorizationReference = authResponse.AuthorizationReference;

      // Store the response logs
      newRide.igoResponseLogs.push({
        type: "authorization",
        data: authResponse,
        timestamp: new Date(),
      });

      // Save the updated ride
      await newRide.save();
    }

    // Return success response with both the API response and our record
    res.status(201).json({
      message: "Ride booked successfully",
      ride: newRide,
      igoResponse: response,
    });
  } catch (error) {
    console.error("Booking error:", error);
    res.status(500).json({
      message: "Error booking ride",
      error: error.message,
    });
  }
};

/**
 * Get ride status
 */
export const getRideStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const ride = await Ride.findOne({
      igoBookingId: bookingId, // Match by iGo booking ID
    });

    if (!ride) {
      return res.status(404).json({
        message: "Ride not found",
      });
    }

    // Get latest status from iGo
    const xmlRequest = igoConfig.buildXmlRequest({
      AgentBookingStatusRequest: {
        Agent: igoConfig.buildAgentSection(),
        Vendor: igoConfig.buildVendorSection(),
        AuthorizationReference: ride.igoAuthorizationReference,
      },
    });

    const response = await sendIgoRequest(xmlRequest);

    // Update our record with the latest status
    if (response.AgentBookingStatusResponse) {
      // Log the status response
      ride.igoResponseLogs.push({
        type: "status",
        data: response.AgentBookingStatusResponse,
        timestamp: new Date(),
      });

      // Update status if available
      const statusResponse = response.AgentBookingStatusResponse;
      if (statusResponse.Status) {
        // Map iGo status to our status
        let newStatus;
        switch (statusResponse.Status) {
          case "Dispatched":
            newStatus = igoConfig.rideStatuses.DISPATCHED;
            break;
          case "InProgress":
            newStatus = igoConfig.rideStatuses.IN_PROGRESS;
            break;
          case "Completed":
            newStatus = igoConfig.rideStatuses.COMPLETED;
            break;
          case "Cancelled":
            newStatus = igoConfig.rideStatuses.CANCELLED;
            break;
          default:
            newStatus = ride.status; // Keep current status
        }

        if (newStatus !== ride.status) {
          ride.status = newStatus;

          // Update timestamps based on status
          if (
            newStatus === igoConfig.rideStatuses.DISPATCHED &&
            !ride.dispatchedAt
          ) {
            ride.dispatchedAt = new Date();
          } else if (
            newStatus === igoConfig.rideStatuses.COMPLETED &&
            !ride.completedAt
          ) {
            ride.completedAt = new Date();
          } else if (
            newStatus === igoConfig.rideStatuses.CANCELLED &&
            !ride.cancelledAt
          ) {
            ride.cancelledAt = new Date();
          }
        }
      }

      await ride.save();
    }

    // Return both our record and the iGo response
    res.json({
      ride,
      igoStatus: response,
    });
  } catch (error) {
    console.error("Status check error:", error);
    res.status(500).json({
      message: "Error fetching ride status",
      error: error.message,
    });
  }
};

/**
 * Get user rides
 */
export const getUserRides = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, limit = 10, skip = 0 } = req.query;

    // Build query
    const query = { user: userId };

    // Add status filter if provided
    if (status) {
      query.status = status;
    }

    // Get rides with pagination
    const rides = await Ride.find(query)
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    // Count total rides matching the query
    const total = await Ride.countDocuments(query);

    res.json({
      rides,
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
        hasMore: total > parseInt(skip) + rides.length,
      },
    });
  } catch (error) {
    console.error("Get user rides error:", error);
    res.status(500).json({
      message: "Error fetching user rides",
      error: error.message,
    });
  }
};

/**
 * Cancel a ride
 */
export const cancelRide = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { cancellationReason } = req.body;

    // Find the ride in our database
    const ride = await Ride.findOne({
      igoBookingId: bookingId, // Match by iGo booking ID
    });

    if (!ride) {
      return res.status(404).json({
        message: "Ride not found",
      });
    }

    // Check if ride is already cancelled
    if (ride.status === igoConfig.rideStatuses.CANCELLED) {
      return res.status(400).json({
        message: "Ride is already cancelled",
      });
    }

    // Check if ride can be cancelled (only pending/booked rides can be cancelled)
    if (
      ![igoConfig.rideStatuses.PENDING, igoConfig.rideStatuses.BOOKED].includes(
        ride.status
      )
    ) {
      return res.status(400).json({
        message: `Cannot cancel ride with status: ${ride.status}`,
      });
    }

    const xmlRequest = igoConfig.buildXmlRequest({
      AgentBookingCancellationRequest: {
        Agent: igoConfig.buildAgentSection(),
        Vendor: igoConfig.buildVendorSection(),
        AuthorizationReference: ride.igoAuthorizationReference,
        CancellationReason:
          cancellationReason || "Customer requested cancellation",
      },
    });

    const response = await sendIgoRequest(xmlRequest);

    // Update our database regardless of iGo response
    ride.status = igoConfig.rideStatuses.CANCELLED;
    ride.cancelledAt = new Date();
    ride.cancellationReason =
      cancellationReason || "Customer requested cancellation";

    // Log the cancellation response
    ride.igoResponseLogs.push({
      type: "cancellation",
      data: response,
      timestamp: new Date(),
    });

    await ride.save();

    res.json({
      message: "Ride cancelled successfully",
      ride,
      igoResponse: response,
    });
  } catch (error) {
    console.error("Cancellation error:", error);
    res.status(500).json({
      message: "Error canceling ride",
      error: error.message,
    });
  }
};

/**
 * Handle iGo webhook events
 */
export const handleIgoWebhook = async (req, res) => {
  try {
    const eventType = req.headers["x-igo-event-type"];
    const eventData = req.body;

    if (!eventType) {
      return res.status(400).json({
        message: "Missing event type header",
      });
    }

    // Process the event
    const result = await handleIgoEvent(eventType, eventData);

    // Log the webhook activity
    console.log(`Webhook processed: ${eventType}`, result);

    // Return a success response to iGo
    res.json({
      status: "success",
      message: `Event ${eventType} processed successfully`,
      ...result,
    });
  } catch (error) {
    console.error("Webhook handling error:", error);
    res.status(500).json({
      message: "Error processing webhook",
      error: error.message,
    });
  }
};

/**
 * Request bids from multiple vendors
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export const requestVendorBids = async (req, res) => {
  try {
    const { pickup, dropoff, time, vehicleType, bidType } = req.body;
    const userId = req.user?._id;

    // Validate user ID
    if (!userId) {
      return res.status(401).json({ message: "User authentication required" });
    }

    // Validate required fields
    if (!pickup || !pickup.address || !pickup.lat || !pickup.lng) {
      return res
        .status(400)
        .json({ message: "Pickup location details are required" });
    }

    if (!dropoff || !dropoff.address || !dropoff.lat || !dropoff.lng) {
      return res
        .status(400)
        .json({ message: "Dropoff location details are required" });
    }

    if (!time) {
      return res.status(400).json({ message: "Pickup time is required" });
    }

    // Helper function to normalize vehicle type
    const normalizeVehicleType = (type) => {
      if (!type) return igoConfig.vehicleTypes.STANDARD;

      // Convert to lowercase for case-insensitive comparison
      const lowercaseType = type.toLowerCase();

      // Find matching vehicle type in igoConfig
      for (const [key, value] of Object.entries(igoConfig.vehicleTypes)) {
        if (
          value.toLowerCase() === lowercaseType ||
          key.toLowerCase() === lowercaseType
        ) {
          return value;
        }
      }

      // If no match found, return as is
      return type;
    };

    // Request bids from iGo service
    const bidsResponse = await requestBids(
      pickup,
      dropoff,
      time,
      vehicleType || igoConfig.vehicleTypes.STANDARD
    );

    // Convert the bids to the correct format for our schema
    const formattedBids = Array.isArray(
      bidsResponse.AgentBidResponse?.Bids?.Bid
    )
      ? bidsResponse.AgentBidResponse.Bids.Bid.map((bid) => ({
          vendorId: bid.VendorId,
          vendorName: bid.VendorName,
          priceBand: {
            currency: bid.PriceBand.Currency,
            minimumPrice: parseFloat(bid.PriceBand.MinimumPrice),
            maximumPrice: parseFloat(bid.PriceBand.MaximumPrice),
            estimatedPrice: parseFloat(bid.PriceBand.EstimatedPrice),
          },
          etaInMinutes: parseInt(bid.ETAInMinutes, 10),
          vehicleType: normalizeVehicleType(bid.VehicleType), // Normalize the vehicle type
        }))
      : [];

    if (
      !Array.isArray(bidsResponse.AgentBidResponse?.Bids?.Bid) &&
      bidsResponse.AgentBidResponse?.Bids?.Bid
    ) {
      // Single bid case
      const bid = bidsResponse.AgentBidResponse.Bids.Bid;
      formattedBids.push({
        vendorId: bid.VendorId,
        vendorName: bid.VendorName,
        priceBand: {
          currency: bid.PriceBand.Currency,
          minimumPrice: parseFloat(bid.PriceBand.MinimumPrice),
          maximumPrice: parseFloat(bid.PriceBand.MaximumPrice),
          estimatedPrice: parseFloat(bid.PriceBand.EstimatedPrice),
        },
        etaInMinutes: parseInt(bid.ETAInMinutes, 10),
        vehicleType: normalizeVehicleType(bid.VehicleType), // Normalize the vehicle type
      });
    }

    // Calculate expiration time (5 minutes)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Save bids to database
    const newBid = new Bid({
      user: userId,
      bidReference: bidsResponse.AgentBidResponse?.BidReference,
      status: igoConfig.bidStatuses.AVAILABLE,
      bidType: bidType || igoConfig.bidTypes.IMMEDIATE,
      pickup,
      dropoff,
      requestedTime: new Date(time),
      expiresAt,
      bids: formattedBids,
      igoResponseLog: JSON.stringify(bidsResponse),
    });

    await newBid.save();

    return res.status(200).json({
      success: true,
      message: "Bids retrieved successfully",
      bidReference: bidsResponse.AgentBidResponse?.BidReference,
      expiresAt,
      bids: formattedBids,
    });
  } catch (error) {
    console.error("Error requesting vendor bids:", error);
    return res.status(500).json({
      message: "Error requesting vendor bids",
      error: error.message,
    });
  }
};

/**
 * Get saved bids by reference
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export const getBidsByReference = async (req, res) => {
  try {
    const { bidReference } = req.params;
    const userId = req.user?._id;

    // Validate reference
    if (!bidReference) {
      return res.status(400).json({ message: "Bid reference is required" });
    }

    // Find bids
    const bid = await Bid.findOne({ bidReference, user: userId });

    if (!bid) {
      return res.status(404).json({ message: "Bids not found" });
    }

    // Check if bids have expired
    if (new Date() > bid.expiresAt) {
      bid.status = igoConfig.bidStatuses.UNAVAILABLE;
      await bid.save();
      return res.status(400).json({
        message: "Bids have expired",
        expiresAt: bid.expiresAt,
      });
    }

    return res.status(200).json({
      success: true,
      bidReference: bid.bidReference,
      status: bid.status,
      expiresAt: bid.expiresAt,
      bids: bid.bids,
      selectedBid: bid.selectedBid,
    });
  } catch (error) {
    console.error("Error retrieving bids:", error);
    return res.status(500).json({
      message: "Error retrieving bids",
      error: error.message,
    });
  }
};

/**
 * Select a bid from available bids
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export const selectBid = async (req, res) => {
  try {
    const { bidReference, vendorId } = req.body;
    const userId = req.user?._id;

    // Validate inputs
    if (!bidReference) {
      return res.status(400).json({ message: "Bid reference is required" });
    }

    if (!vendorId) {
      return res.status(400).json({ message: "Vendor ID is required" });
    }

    // Helper function to normalize vehicle type
    const normalizeVehicleType = (type) => {
      if (!type) return igoConfig.vehicleTypes.STANDARD;

      // Convert to lowercase for case-insensitive comparison
      const lowercaseType = type.toLowerCase();

      // Find matching vehicle type in igoConfig
      for (const [key, value] of Object.entries(igoConfig.vehicleTypes)) {
        if (
          value.toLowerCase() === lowercaseType ||
          key.toLowerCase() === lowercaseType
        ) {
          return value;
        }
      }

      // If no match found, return as is
      return type;
    };

    // Find bids
    const bid = await Bid.findOne({ bidReference, user: userId });

    if (!bid) {
      return res.status(404).json({ message: "Bids not found" });
    }

    // Check if bids have expired
    if (new Date() > bid.expiresAt) {
      bid.status = igoConfig.bidStatuses.UNAVAILABLE;
      await bid.save();
      return res.status(400).json({
        message: "Bids have expired",
        expiresAt: bid.expiresAt,
      });
    }

    // Find selected vendor bid
    const selectedBid = bid.bids.find((b) => b.vendorId === vendorId);

    if (!selectedBid) {
      return res.status(404).json({ message: "Selected vendor bid not found" });
    }

    // Update bid with selection
    bid.selectedBid = selectedBid;
    await bid.save();

    // Proceed with availability check using the selected bid - use checkAvailability directly from imports
    const availabilityResponse = await checkAvailability(
      bid.pickup,
      bid.dropoff,
      bid.requestedTime,
      normalizeVehicleType(selectedBid.vehicleType) // Normalize vehicle type for API request
    );

    // Return the availability reference for booking
    return res.status(200).json({
      success: true,
      message: "Bid selected successfully",
      bidReference: bid.bidReference,
      selectedBid: selectedBid,
      availabilityReference:
        availabilityResponse.AgentBookingAvailabilityResponse
          ?.AvailabilityReference,
      priceBand: {
        currency: selectedBid.priceBand.currency,
        minimumPrice: selectedBid.priceBand.minimumPrice,
        maximumPrice: selectedBid.priceBand.maximumPrice,
        estimatedPrice: selectedBid.priceBand.estimatedPrice,
      },
      etaInMinutes: selectedBid.etaInMinutes,
    });
  } catch (error) {
    console.error("Error selecting bid:", error);
    return res.status(500).json({
      message: "Error selecting bid",
      error: error.message,
    });
  }
};
