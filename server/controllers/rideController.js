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
} from "../services/igoService.js";
import Ride from "../models/Ride.js";
import igoConfig from "../config/igoConfig.js";

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

    const xmlRequest = buildXmlRequest({
      AgentBookingAvailabilityRequest: {
        Agent: buildAgentSection(),
        Vendor: buildVendorSection(),
        Journey: {
          Pickup: pickup,
          Dropoff: dropoff,
          Time: time,
        },
        VehicleType: vehicleType || "Standard",
        Pricing: buildPricingSection({
          pricingModel: pricingModel || PRICING_MODELS.UP_FRONT,
          paymentPoint: paymentPoint || PAYMENT_POINTS.TIME_OF_BOOKING,
          flags: [PRICING_FLAGS.ALLOW_WAITING_TIME, PRICING_FLAGS.ALLOW_EXTRAS],
        }),
      },
    });

    const response = await sendIgoRequest(xmlRequest);

    // Store the availability reference for later use
    if (
      response.AgentBookingAvailabilityResponse &&
      response.AgentBookingAvailabilityResponse.AvailabilityReference
    ) {
      // You might want to store this temporarily in a cache or session
      req.session.availabilityReference =
        response.AgentBookingAvailabilityResponse.AvailabilityReference;
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
    if (!userId || !pickup || !dropoff || !time || !passengerDetails) {
      return res.status(400).json({
        message: "Missing required fields for booking",
      });
    }

    // Generate a unique booking reference
    const agentBookingReference = igoConfig.generateBookingReference();

    // Create new ride record in database
    const newRide = new Ride({
      user: userId,
      pickupLocation: pickup,
      dropoffLocation: dropoff,
      pickupTime: new Date(time),
      fare: price || 0,
      status: igoConfig.rideStatuses.BOOKED,
      pricingModel: pricingModel || PRICING_MODELS.UP_FRONT,
      paymentPoint: paymentPoint || PAYMENT_POINTS.TIME_OF_BOOKING,
      passengers: passengerDetails,
      specialInstructions: specialInstructions || "",
      vehicleType: vehicleType || "Standard",
      igoAvailabilityReference:
        availabilityReference || req.session?.availabilityReference,
      bookedAt: new Date(),
    });

    // Save ride to get the _id
    await newRide.save();

    const xmlRequest = buildXmlRequest({
      AgentBookingAuthorizationRequest: {
        Agent: buildAgentSection(),
        Vendor: buildVendorSection(),
        AvailabilityReference:
          availabilityReference ||
          req.session?.availabilityReference ||
          "AvailabilityRef",
        AgentBookingReference: agentBookingReference,
        Journey: {
          Pickup: pickup,
          Dropoff: dropoff,
          Time: time,
        },
        VehicleType: vehicleType || "Standard",
        Pricing: buildPricingSection({
          pricingModel: pricingModel || PRICING_MODELS.UP_FRONT,
          paymentPoint: paymentPoint || PAYMENT_POINTS.TIME_OF_BOOKING,
          price,
          flags: [PRICING_FLAGS.ALLOW_WAITING_TIME, PRICING_FLAGS.ALLOW_EXTRAS],
        }),
        Passengers: {
          PassengerDetails: passengerDetails.map((passenger) => ({
            Name: passenger.name,
            TelephoneNumber: passenger.phone,
            EmailAddress: passenger.email,
            IsLead: passenger.isLead ? "true" : "false",
          })),
        },
        DriverNote: specialInstructions || "",
        YourReference: `Booking_${newRide._id}`,
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

    // Check if the booking exists in our system
    const ride = await Ride.findOne({
      $or: [
        { _id: bookingId },
        { igoBookingId: bookingId },
        { igoAuthorizationReference: bookingId },
      ],
    });

    if (!ride) {
      return res.status(404).json({
        message: "Ride not found",
      });
    }

    // Get latest status from iGo
    const xmlRequest = buildXmlRequest({
      AgentBookingStatusRequest: {
        Agent: buildAgentSection(),
        Vendor: buildVendorSection(),
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
      $or: [
        { _id: bookingId },
        { igoBookingId: bookingId },
        { igoAuthorizationReference: bookingId },
      ],
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

    const xmlRequest = buildXmlRequest({
      AgentBookingCancellationRequest: {
        Agent: buildAgentSection(),
        Vendor: buildVendorSection(),
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
