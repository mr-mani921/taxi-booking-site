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
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Get price estimate for a ride
 */
export const getPriceEstimate = async (req, res) => {
  try {
    const {
      pickupLocation,
      dropoffLocation,
      pickupTime,
      passengers = 1,
      luggage,
      isOneWay,
    } = req.body;
    console.log(
      `Request received for price estimate maeney tumhey bss pakkar hi lia :`,
      JSON.stringify(
        {
          pickupLocation,
          dropoffLocation,
          pickupTime,
          passengers,
        },
        null,
        2
      )
    );

    // Validate required inputs
    if (!pickupLocation || !dropoffLocation || !pickupTime) {
      return res.status(400).json({
        message:
          "Missing required fields: pickupLocation, dropoffLocation, and pickupTime are required",
      });
    }

    // Validate coordinates
    if (!pickupLocation.lat || !pickupLocation.lng) {
      return res.status(400).json({
        message: "Pickup location must include lat and lng coordinates",
      });
    }

    // Format the pickup location to include address if available
    const formattedPickup = {
      lat: pickupLocation.lat,
      lng: pickupLocation.lng,
      address:
        pickupLocation.address ||
        `${pickupLocation.lat.toFixed(6)}, ${pickupLocation.lng.toFixed(6)}`,
    };

    // Format the dropoff location to include address if available
    let formattedDropoff;
    if (
      typeof dropoffLocation === "string" ||
      !dropoffLocation.lat ||
      !dropoffLocation.lng
    ) {
      console.log(
        "Warning: dropoffLocation is not properly formatted. This should not happen if using the updated frontend."
      );

      // For backward compatibility, create a fake coordinate close to pickup
      formattedDropoff = {
        lat: parseFloat(pickupLocation.lat) + 0.01,
        lng: parseFloat(pickupLocation.lng) + 0.01,
        address:
          typeof dropoffLocation === "string"
            ? dropoffLocation
            : "Unknown location",
      };
    } else {
      formattedDropoff = {
        lat: dropoffLocation.lat,
        lng: dropoffLocation.lng,
        address:
          dropoffLocation.address ||
          `${dropoffLocation.lat.toFixed(6)}, ${dropoffLocation.lng.toFixed(
            6
          )}`,
      };
    }

    // Format the date properly
    let formattedPickupTime;
    try {
      // Ensure the date is valid and properly formatted
      const pickupDate = new Date(pickupTime);
      if (isNaN(pickupDate.getTime())) {
        throw new Error("Invalid date format");
      }
      formattedPickupTime = pickupDate.toISOString();
      console.log("Formatted pickup time:", formattedPickupTime);
    } catch (err) {
      return res.status(400).json({
        message:
          "Invalid pickup time format. Please use ISO format (YYYY-MM-DDTHH:MM)",
      });
    }

    // Create passenger information for the request
    const passengerDetails = [];
    const mainPassenger = {
      name: req.user?.name || "Guest User",
      phone: req.user?.phone || "",
      email: req.user?.email || "",
      isLead: true,
    };
    passengerDetails.push(mainPassenger);

    // Add additional passengers if specified
    if (passengers > 1) {
      for (let i = 1; i < passengers; i++) {
        passengerDetails.push({
          name: `Additional Passenger ${i}`,
          phone: "",
          email: "",
          isLead: false,
        });
      }
    }

    // Log the request parameters for debugging
    console.log("Sending bid request with:", {
      pickup: formattedPickup,
      dropoff: formattedDropoff,
      time: formattedPickupTime,
      passengers: passengerDetails.length,
    });

    const response = await getEstimatedPrice(
      formattedPickup,
      formattedDropoff,
      formattedPickupTime,
      undefined, // Use default vehicle type
      passengerDetails
    );

    // Process the AgentBidResponse (different from AgentPriceEstimateResponse)
    let formattedResponse = {
      estimatedPrice: 0,
      originalPrice: 0,
      platformMarkup: "25%",
      quotes: [],
    };

    // Extract quotes from bids in the response
    if (
      response.AgentBidResponse &&
      response.AgentBidResponse.Bids &&
      response.AgentBidResponse.Bids.Bid
    ) {
      const bids = Array.isArray(response.AgentBidResponse.Bids.Bid)
        ? response.AgentBidResponse.Bids.Bid
        : [response.AgentBidResponse.Bids.Bid];

      formattedResponse.quotes = bids.map((bid, index) => {
        // Extract price information
        let price = 0;
        if (bid.PriceBand && bid.PriceBand.EstimatedPrice) {
          price = parseFloat(bid.PriceBand.EstimatedPrice);
        }

        // Apply 25% markup
        const markedUpPrice = price * 1.25;

        return {
          id: index + 1,
          vendorId: bid.VendorId,
          vendorName: bid.VendorName || `Vendor ${index + 1}`,
          price: parseFloat(markedUpPrice.toFixed(2)),
          originalPrice: price,
          vehicleType: bid.VehicleType || "standard",
          estimatedArrival: new Date(
            new Date(pickupTime).getTime() + (bid.ETAInMinutes || 15) * 60000
          ),
          etaInMinutes: bid.ETAInMinutes || 15,
        };
      });

      // Set the estimated price based on the first quote or average
      if (formattedResponse.quotes.length > 0) {
        if (formattedResponse.quotes.length === 1) {
          formattedResponse.estimatedPrice = formattedResponse.quotes[0].price;
          formattedResponse.originalPrice =
            formattedResponse.quotes[0].originalPrice;
        } else {
          // Calculate average price
          const totalPrice = formattedResponse.quotes.reduce(
            (sum, quote) => sum + quote.price,
            0
          );
          const totalOriginal = formattedResponse.quotes.reduce(
            (sum, quote) => sum + quote.originalPrice,
            0
          );
          formattedResponse.estimatedPrice = parseFloat(
            (totalPrice / formattedResponse.quotes.length).toFixed(2)
          );
          formattedResponse.originalPrice = parseFloat(
            (totalOriginal / formattedResponse.quotes.length).toFixed(2)
          );
        }
      }

      // Store the bid reference if available
      if (response.AgentBidResponse.BidReference) {
        formattedResponse.bidReference = response.AgentBidResponse.BidReference;
      }
    } else {
      // Check for error response
      if (
        response.AgentBidResponse &&
        response.AgentBidResponse.Result &&
        response.AgentBidResponse.Result.Success === "false"
      ) {
        console.log("API returned an error:", response.AgentBidResponse.Result);
        return res.status(400).json({
          message: `API Error: ${
            response.AgentBidResponse.Result.FailureReason || "Unknown error"
          }`,
          code: response.AgentBidResponse.Result.FailureCode || "UNKNOWN",
        });
      }

      console.log("No bids returned from API:", response);

      // For development/testing, create a mock bid to allow UI to continue working
      if (
        process.env.NODE_ENV !== "production" ||
        process.env.MOCK_MODE === "true"
      ) {
        console.log("Using mock data for quotes");
        // Generate multiple mock bids with different prices and times
        formattedResponse.quotes = [
          {
            id: 1,
            vendorId: "MOCK_VENDOR_1",
            vendorName: "Premium Taxi Service",
            price: 28.5,
            originalPrice: 22.8,
            vehicleType: "premium",
            estimatedArrival: new Date(
              new Date(pickupTime).getTime() + 10 * 60000
            ),
            etaInMinutes: 10,
          },
          {
            id: 2,
            vendorId: "MOCK_VENDOR_2",
            vendorName: "Standard Taxi Service",
            price: 21.25,
            originalPrice: 17.0,
            vehicleType: "standard",
            estimatedArrival: new Date(
              new Date(pickupTime).getTime() + 15 * 60000
            ),
            etaInMinutes: 15,
          },
          {
            id: 3,
            vendorId: "MOCK_VENDOR_3",
            vendorName: "Budget Taxi Service",
            price: 18.75,
            originalPrice: 15.0,
            vehicleType: "standard",
            estimatedArrival: new Date(
              new Date(pickupTime).getTime() + 20 * 60000
            ),
            etaInMinutes: 20,
          },
        ];

        // Calculate average for estimated price
        const totalPrice = formattedResponse.quotes.reduce(
          (sum, quote) => sum + quote.price,
          0
        );
        const totalOriginal = formattedResponse.quotes.reduce(
          (sum, quote) => sum + quote.originalPrice,
          0
        );

        formattedResponse.estimatedPrice = parseFloat(
          (totalPrice / formattedResponse.quotes.length).toFixed(2)
        );
        formattedResponse.originalPrice = parseFloat(
          (totalOriginal / formattedResponse.quotes.length).toFixed(2)
        );
        formattedResponse.bidReference = "MOCK_BID_" + Date.now();
        formattedResponse.isMocked = true;
      }
    }

    res.json(formattedResponse);
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

    // Apply 25% markup to the price if available
    if (
      response.AgentBookingAvailabilityResponse &&
      response.AgentBookingAvailabilityResponse.Price
    ) {
      const originalPrice = response.AgentBookingAvailabilityResponse.Price;
      const markedUpPrice = originalPrice * 1.25; // Add 25%
      response.AgentBookingAvailabilityResponse.Price = parseFloat(
        markedUpPrice.toFixed(2)
      );

      // Store both original and platform prices for reference
      response.AgentBookingAvailabilityResponse.originalPrice = originalPrice;
      response.AgentBookingAvailabilityResponse.platformMarkup = "25%";
    }

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
      pickupLocation,
      dropoffLocation,
      pickupTime,
      pricingModel,
      paymentPoint,
      price,
      passengers,
      specialInstructions,
      vehicleType,
      availabilityReference,
      paymentToken, // Add payment token parameter for upfront payment
    } = req.body;

    // Validate required inputs
    if (!pickupLocation || !dropoffLocation || !pickupTime || !passengers) {
      console.log("the data is ", req.body);

      return res.status(400).json({
        message: "Missing required fields for booking",
      });
    }

    // If payment point is TIME_OF_BOOKING, payment token is required
    if (
      (paymentPoint === PAYMENT_POINTS.TIME_OF_BOOKING || !paymentPoint) && // Default payment point is TIME_OF_BOOKING
      !paymentToken
    ) {
      return res.status(400).json({
        message: "Payment token is required for upfront payment",
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

    // Determine final pricing model and payment point
    const finalPricingModel = pricingModel || PRICING_MODELS.UP_FRONT;
    const finalPaymentPoint = paymentPoint || PAYMENT_POINTS.TIME_OF_BOOKING;

    // Apply 25% markup to price if provided
    const originalPrice = price || 0;
    const markedUpPrice = parseFloat((originalPrice * 1.25).toFixed(2));

    // Create new ride record in database
    const newRide = new Ride({
      user: userObjectId,
      pickupLocation: pickup,
      dropoffLocation: dropoff,
      pickupTime: new Date(time),
      fare: markedUpPrice,
      status: igoConfig.rideStatuses.BOOKED,
      pricingModel: finalPricingModel,
      paymentPoint: finalPaymentPoint,
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
          pricingModel: finalPricingModel,
          paymentPoint: finalPaymentPoint,
          price: originalPrice, // Send original price to iGo, not marked up price
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
    } else {
      // If booking was not successful, return error
      return res.status(400).json({
        message: "Booking failed",
        igoResponse: response,
      });
    }

    // If payment point is TIME_OF_BOOKING, process payment now
    let paymentResponse = null;
    if (finalPaymentPoint === PAYMENT_POINTS.TIME_OF_BOOKING && paymentToken) {
      paymentResponse = await processUpfrontPayment(newRide, paymentToken);

      if (!paymentResponse.success) {
        // If payment failed, we might want to cancel the booking
        // But for now, we'll just return the error
        return res.status(400).json({
          message: "Payment failed",
          error: paymentResponse.error,
          ride: newRide,
        });
      }

      // Update the ride with payment information
      newRide.paymentStatus = "PAID";
      newRide.paymentReference = paymentResponse.paymentReference;
      newRide.paymentMethod = "CARD";
      newRide.paymentTransactionReference = paymentResponse.transactionId;
      newRide.paymentDate = new Date();

      // Calculate commission (25% of the fare)
      const commissionAmount = parseFloat((markedUpPrice * 0.2).toFixed(2)); // 20% of marked-up price = 25% markup
      const vendorAmount = markedUpPrice - commissionAmount;

      // Store commission information
      newRide.commissionDetails = {
        commissionAmount: commissionAmount,
        vendorAmount: vendorAmount,
        commissionPercentage: "20%", // 20% of final price
        markupPercentage: "25%", // 25% markup over vendor price
        calculatedAt: new Date(),
      };

      await newRide.save();
    }

    // Return success response with both the API response and our record
    res.status(201).json({
      message: "Ride booked successfully",
      ride: newRide,
      igoResponse: response,
      paymentResponse: paymentResponse
        ? {
            success: paymentResponse.success,
            paymentReference: paymentResponse.paymentReference,
            paymentStatus: newRide.paymentStatus,
          }
        : null,
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
 * Process upfront payment for a newly booked ride
 * @param {Object} ride - The ride object
 * @param {string} paymentToken - The payment token from Stripe
 * @returns {Promise<Object>} - The payment result
 */
const processUpfrontPayment = async (ride, paymentToken) => {
  try {
    // Process payment through Stripe
    const paymentResult = await processCardPayment(
      ride.fare,
      paymentToken,
      `Upfront payment for taxi booking ${ride.igoBookingId || ride._id}`
    );

    if (!paymentResult.success) {
      return {
        success: false,
        error: "Payment processing failed",
        details: paymentResult,
      };
    }

    // Record the payment in iGo
    try {
      const igoPaymentResult = await sendIgoRequest(
        igoConfig.buildXmlRequest({
          AgentPaymentRequest: {
            Agent: igoConfig.buildAgentSection(),
            Vendor: igoConfig.buildVendorSection(),
            AuthorizationReference: ride.igoAuthorizationReference,
            Amount: ride.fare,
            PaymentMethod: "CARD",
            TransactionReference: paymentResult.transactionId,
          },
        })
      );

      // Even if iGo recording fails, we'll still consider payment successful
      // as the Stripe payment went through
    } catch (error) {
      console.error("Error recording payment in iGo:", error);
      // We don't return an error here because the Stripe payment was successful
    }

    return {
      success: true,
      paymentReference: paymentResult.transactionId,
      transactionId: paymentResult.transactionId,
      transactionTime: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error processing upfront payment:", error);
    return {
      success: false,
      error: error.message,
    };
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
    // Enhanced logging for webhook events
    console.log("iGo Webhook received:", {
      headers: req.headers,
      eventType: req.headers["x-igo-event-type"],
      body: JSON.stringify(req.body),
      timestamp: new Date().toISOString(),
    });

    const eventType = req.headers["x-igo-event-type"];
    const eventData = req.body;

    if (!eventType) {
      return res.status(400).json({
        message: "Missing event type header",
      });
    }

    // Process the event
    const result = await handleIgoEvent(eventType, eventData);

    // For completed rides, automatically request bill if final payment is needed
    if (
      (eventType === igoConfig.eventTypes.COMPLETED ||
        eventType === igoConfig.eventTypes.JOURNEY_COMPLETED) &&
      result.status === "processed" &&
      result.rideId
    ) {
      try {
        // Find the ride
        const ride = await Ride.findById(result.rideId);

        // If ride exists and payment is not already processed and payment point is END_OF_JOURNEY
        if (
          ride &&
          ride.paymentStatus !== "PAID" &&
          ride.paymentPoint === PAYMENT_POINTS.END_OF_JOURNEY
        ) {
          // Request bill to get final fare
          console.log(
            `Automatically requesting bill for completed ride ${ride._id}`
          );

          const billResult = await sendIgoRequest(
            igoConfig.buildXmlRequest({
              AgentBillRequest: {
                Agent: igoConfig.buildAgentSection(),
                Vendor: igoConfig.buildVendorSection(),
                AuthorizationReference: ride.igoAuthorizationReference,
              },
            })
          );

          if (billResult && billResult.AgentBillResponse) {
            // Update ride with bill information
            ride.billDetails = {
              billItems: billResult.AgentBillResponse.BillItems?.BillItem || [],
              subTotal: billResult.AgentBillResponse.SubTotal,
              tax: billResult.AgentBillResponse.Tax,
              total: billResult.AgentBillResponse.Total,
              currency: billResult.AgentBillResponse.Currency,
              paymentStatus: billResult.AgentBillResponse.PaymentStatus,
            };

            // Update final fare if available from bill (plus 25% markup)
            if (billResult.AgentBillResponse.Total) {
              const originalFare = parseFloat(
                billResult.AgentBillResponse.Total
              );
              const markedUpFare = parseFloat((originalFare * 1.25).toFixed(2));
              ride.finalFare = markedUpFare;

              // Store both original and platform prices for reference
              ride.originalFare = originalFare;
              ride.platformMarkup = "25%";
            }

            await ride.save();

            // Add bill information to webhook response
            result.billRequested = true;
            result.billDetails = ride.billDetails;
          }
        }
      } catch (error) {
        console.error("Error automatically requesting bill:", error);
        // Don't fail the webhook due to bill request failure
      }
    }

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
    const {
      pickupLocation,
      dropoffLocation,
      pickupTime,
      vehicleType,
      passengers = 1,
      bidType = igoConfig.bidTypes.BOTH,
    } = req.body;

    const userId = req.user?._id;
    console.log("Received bid request:", req.body);

    if (!userId) {
      return res.status(401).json({ message: "User authentication required" });
    }

    if (
      !pickupLocation ||
      !pickupLocation.address ||
      !pickupLocation.lat ||
      !pickupLocation.lng
    ) {
      return res
        .status(400)
        .json({ message: "Pickup location details are required" });
    }

    if (
      !dropoffLocation ||
      !dropoffLocation.address ||
      !dropoffLocation.lat ||
      !dropoffLocation.lng
    ) {
      return res
        .status(400)
        .json({ message: "Dropoff location details are required" });
    }

    if (!pickupTime) {
      return res.status(400).json({ message: "Pickup time is required" });
    }

    const normalizeVehicleType = (type) => {
      if (!type) return igoConfig.vehicleTypes.STANDARD;
      const lowercaseType = type.toLowerCase();
      for (const [key, value] of Object.entries(igoConfig.vehicleTypes)) {
        if (
          value.toLowerCase() === lowercaseType ||
          key.toLowerCase() === lowercaseType
        ) {
          return value;
        }
      }
      return igoConfig.vehicleTypes.STANDARD;
    };

    const normalizedVehicleType = normalizeVehicleType(vehicleType);

    const bidsResponse = await requestBids(
      pickupLocation,
      dropoffLocation,
      pickupTime,
      normalizedVehicleType,
      passengers
    );

    const formattedBids = [];
    const rawBids = bidsResponse.AgentBidResponse?.Offers?.Offer;
    const ensureArray = (data) => (Array.isArray(data) ? data : [data]);

    for (const bid of ensureArray(rawBids)) {
      const pricing = bid.Pricing || {};
      const vendor = bid.VendorDetails || {};
      const journey = bid.EstimatedJourney || {};

      formattedBids.push({
        vendorName: vendor.Name || "Unknown Vendor",
        vendorAddress: vendor.Address || "",
        vendorCity: vendor.City || "",
        vendorCountry: vendor.Country || "",
        vendorPhone: vendor.TelephoneNumber || "",
        rating: vendor.Rating || null,
        numberOfRatings: parseInt(bid.NumberOfRatings || "0", 10),
        vehicleType: normalizeVehicleType(bid.VehicleType),
        etaInMinutes: parseInt(bid.AverageEta || "0", 10),
        estimatedDistance: parseFloat(journey.Distance || 0),
        estimatedDuration: parseInt(journey.Duration || "0", 10),
        pricing: {
          pricingMethod: pricing.PricingMethod || "",
          price: parseFloat(pricing.Price || 0),
          commission: parseFloat(pricing.Commission || 0),
          gratuity: parseFloat(pricing.Gratuity || 0),
          currency: pricing.Currency || "GBP",
          loyaltyCard: parseFloat(pricing.LoyaltyCard || 0),
          promotionCodeDiscount: parseFloat(pricing.PromotionCodeDiscount || 0),
          priceNET: parseFloat(pricing.PriceNET || 0),
          serviceCharge: parseFloat(pricing.ServiceCharge || 0),
          VAT: parseFloat(pricing.VAT || 0),
          marketPlaceCommission: parseFloat(pricing.MarketPlaceCommission || 0),
          marketPlaceCommissionVAT: parseFloat(pricing.MarketPlaceCommissionVAT || 0),
          serviceChargeVAT: parseFloat(pricing.ServiceChargeVAT || 0),
          agentCommission: parseFloat(pricing.AgentCommission || 0),
          agentCommissionVAT: parseFloat(pricing.AgentCommissionVAT || 0),
          cancellationCharge: parseFloat(pricing.CancellationCharge || 0),
          noFareCharge: parseFloat(pricing.NoFareCharge || 0),
          areaCharge: parseFloat(pricing.AreaCharge || 0),
          surgeFactor: parseFloat(pricing.SurgeFactor || 100),
        },
      });
      
    }

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    const newBid = new Bid({
      user: userId,
      bidReference: bidsResponse.AgentBidResponse?.BidReference,
      status: igoConfig.bidStatuses.AVAILABLE,
      bidType,
      pickup: pickupLocation,
      dropoff: dropoffLocation,
      requestedTime: new Date(pickupTime),
      expiresAt,
      bids: formattedBids,
      igoResponseLog: JSON.stringify(bidsResponse),
    });

    await newBid.save();

    console.log("formatted bids", formattedBids)

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

/**
 * Process payment for a completed ride
 * @route POST /api/rides/:id/payment
 */
export const processPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentToken, cardDetails } = req.body;

    // Card payment is the only supported method
    const paymentMethod = "CARD";

    // Validate required fields
    if (!paymentToken) {
      return res.status(400).json({ message: "Payment token is required" });
    }

    // Find the ride by ID
    const ride = await Ride.findById(id);
    if (!ride) {
      return res.status(404).json({ message: "Ride not found" });
    }

    // Check if ride is completed
    if (ride.status !== igoConfig.rideStatuses.COMPLETED) {
      return res.status(400).json({
        message: "Cannot process payment for a ride that is not completed",
        status: ride.status,
      });
    }

    // Check if payment has already been processed
    if (ride.paymentStatus === "PAID") {
      return res
        .status(400)
        .json({ message: "Payment has already been processed for this ride" });
    }

    // Get the final amount to charge
    const amountToCharge = ride.finalFare || ride.fare;

    if (!amountToCharge || amountToCharge <= 0) {
      return res.status(400).json({ message: "Invalid payment amount" });
    }

    // Process payment through Stripe
    const paymentResult = await processCardPayment(
      amountToCharge,
      paymentToken,
      `Taxi ride payment for ${ride.igoBookingId || id}`
    );

    if (!paymentResult.success) {
      return res.status(400).json({
        message: "Payment failed",
        details: paymentResult,
      });
    }

    // Record the payment in iGo (for tracking purposes)
    const igoPaymentResult = await sendIgoRequest(
      igoConfig.buildXmlRequest({
        AgentPaymentRequest: {
          Agent: igoConfig.buildAgentSection(),
          Vendor: igoConfig.buildVendorSection(),
          AuthorizationReference: ride.igoAuthorizationReference,
          Amount: ride.finalFare || ride.fare,
          PaymentMethod: paymentMethod,
          TransactionReference: paymentResult.transactionId,
          CardDetails: cardDetails,
        },
      })
    );

    // Update ride with payment information
    ride.paymentStatus = "PAID";
    ride.paymentReference = paymentResult.transactionId;
    ride.paymentMethod = paymentMethod;
    ride.paymentTransactionReference = paymentResult.transactionId;
    ride.paymentDate = new Date();

    if (cardDetails) {
      // Store only last 4 digits of card number for reference
      ride.paymentCardDetails = {
        cardType: cardDetails.cardType,
        lastFourDigits: cardDetails.cardNumber?.slice(-4) || "****",
        expiryMonth: cardDetails.expiryMonth,
        expiryYear: cardDetails.expiryYear,
      };
    }

    // Calculate commission (25% of the fare)
    const commissionAmount = parseFloat((amountToCharge * 0.2).toFixed(2)); // 20% of marked-up price = 25% markup
    const vendorAmount = amountToCharge - commissionAmount;

    // Store commission information
    ride.commissionDetails = {
      commissionAmount: commissionAmount,
      vendorAmount: vendorAmount,
      commissionPercentage: "20%", // 20% of final price
      markupPercentage: "25%", // 25% markup over vendor price
      calculatedAt: new Date(),
    };

    await ride.save();

    return res.status(200).json({
      message: "Payment processed successfully",
      paymentReference: paymentResult.transactionId,
      transactionTime: new Date().toISOString(),
      paymentStatus: ride.paymentStatus,
      amountPaid: amountToCharge,
      ride: ride._id,
    });
  } catch (error) {
    console.error("Error processing payment:", error);
    return res.status(500).json({
      message: "Error processing payment",
      error: error.message,
    });
  }
};

// Process actual payment before recording it in iGo
const processCardPayment = async (amount, cardToken, description) => {
  try {
    // For test tokens like 'tok_visa', use them correctly in the PaymentIntent API
    // First check if the token is a test token
    if (cardToken.startsWith("tok_")) {
      // Using test tokens directly with PaymentIntent requires specific setup
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Stripe uses cents
        currency: "usd",
        payment_method_types: ["card"],
        description,
      });

      // Confirm with the test token
      const confirmedIntent = await stripe.paymentIntents.confirm(
        paymentIntent.id,
        {
          payment_method_data: {
            type: "card",
            card: { token: cardToken },
          },
        }
      );

      return {
        success: confirmedIntent.status === "succeeded",
        transactionId: confirmedIntent.id,
      };
    } else {
      // For real payment methods (not test tokens)
      // First create a payment method from the token if it's not already a payment method
      let paymentMethodId = cardToken;

      // If it's not already a payment method ID (pm_...), create one
      if (!cardToken.startsWith("pm_")) {
        const paymentMethod = await stripe.paymentMethods.create({
          type: "card",
          card: { token: cardToken },
        });
        paymentMethodId = paymentMethod.id;
      }

      // Create and confirm the payment intent with the payment method
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Stripe uses cents
        currency: "usd",
        payment_method: paymentMethodId,
        description,
        confirm: true,
      });

      return {
        success: paymentIntent.status === "succeeded",
        transactionId: paymentIntent.id,
      };
    }
  } catch (error) {
    console.error("Payment processing error:", error);
    throw error;
  }
};

/**
 * Request a bill for a completed ride
 * @route GET /api/rides/:id/bill
 */
export const requestBill = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the ride by ID
    const ride = await Ride.findById(id);
    if (!ride) {
      return res.status(404).json({ message: "Ride not found" });
    }

    // Check if ride has an authorization reference
    if (!ride.igoAuthorizationReference) {
      return res.status(400).json({
        message: "Ride does not have a valid authorization reference",
      });
    }

    // Request bill from iGo service
    const billResult = await sendIgoRequest(
      igoConfig.buildXmlRequest({
        AgentBillRequest: {
          Agent: igoConfig.buildAgentSection(),
          Vendor: igoConfig.buildVendorSection(),
          AuthorizationReference: ride.igoAuthorizationReference,
        },
      })
    );

    if (!billResult || billResult.Status !== "OK") {
      return res.status(400).json({
        message: "Failed to retrieve bill",
        details: billResult,
      });
    }

    // Update ride with bill information
    ride.billDetails = {
      billItems: billResult.AgentBillResponse?.BillItems?.BillItem || [],
      subTotal: billResult.SubTotal,
      tax: billResult.Tax,
      total: billResult.Total,
      currency: billResult.Currency,
      paymentStatus: billResult.PaymentStatus,
    };

    // Update final fare if available from bill
    if (billResult.Total) {
      ride.finalFare = parseFloat(billResult.Total);
    }

    await ride.save();

    return res.status(200).json({
      message: "Bill retrieved successfully",
      billDetails: ride.billDetails,
      ride: ride._id,
    });
  } catch (error) {
    console.error("Error requesting bill:", error);
    return res.status(500).json({
      message: "Error requesting bill",
      error: error.message,
    });
  }
};

/**
 * Get receipt for a completed and paid ride
 * @route GET /api/rides/:id/receipt
 */
export const getReceipt = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the ride by ID
    const ride = await Ride.findById(id);
    if (!ride) {
      return res.status(404).json({ message: "Ride not found" });
    }

    // Check if payment has been processed
    if (ride.paymentStatus !== "PAID") {
      return res.status(400).json({
        message: "Cannot get receipt for a ride that has not been paid",
      });
    }

    // Check if ride has an authorization reference
    if (!ride.igoAuthorizationReference) {
      return res.status(400).json({
        message: "Ride does not have a valid authorization reference",
      });
    }

    // Get receipt from iGo service
    const receiptResult = await sendIgoRequest(
      igoConfig.buildXmlRequest({
        AgentReceiptRequest: {
          Agent: igoConfig.buildAgentSection(),
          Vendor: igoConfig.buildVendorSection(),
          AuthorizationReference: ride.igoAuthorizationReference,
        },
      })
    );

    if (!receiptResult || receiptResult.Status !== "OK") {
      return res.status(400).json({
        message: "Failed to retrieve receipt",
        details: receiptResult,
      });
    }

    // Update ride with receipt information
    ride.receiptDetails = {
      receiptNumber: receiptResult.AgentReceiptResponse?.ReceiptNumber,
      vendorName: receiptResult.AgentReceiptResponse?.VendorName,
      bookingReference: receiptResult.AgentReceiptResponse?.BookingReference,
      paymentReference: receiptResult.AgentReceiptResponse?.PaymentReference,
      journeyDetails: receiptResult.AgentReceiptResponse?.JourneyDetails,
      billItems: receiptResult.AgentReceiptResponse?.BillItems?.BillItem || [],
      subTotal: receiptResult.AgentReceiptResponse?.SubTotal,
      tax: receiptResult.AgentReceiptResponse?.Tax,
      total: receiptResult.AgentReceiptResponse?.Total,
      currency: receiptResult.AgentReceiptResponse?.Currency,
      paymentMethod: receiptResult.AgentReceiptResponse?.PaymentMethod,
      paymentTime: receiptResult.AgentReceiptResponse?.PaymentTime,
      receiptURL: receiptResult.AgentReceiptResponse?.ReceiptURL,
    };

    await ride.save();

    return res.status(200).json({
      message: "Receipt retrieved successfully",
      receiptDetails: ride.receiptDetails,
      ride: ride._id,
    });
  } catch (error) {
    console.error("Error getting receipt:", error);
    return res.status(500).json({
      message: "Error getting receipt",
      error: error.message,
    });
  }
};
