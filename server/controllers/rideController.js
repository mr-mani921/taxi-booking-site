const {
  sendIgoRequest,
  buildXmlRequest,
  handleIgoEvent,
  getEstimatedPrice,
  PRICING_MODELS,
  PAYMENT_POINTS,
  PRICING_FLAGS,
  requestBids,
  checkAvailability,
  sendRideAuthorizationRequest,
} = require("../services/igoService.js");
const Ride = require("../models/Ride.js");
const igoConfig = require("../config/igoConfig.js");
const Bid = require("../models/Bid.js");
const Stripe = require("stripe");
const User = require("../models/User.js");
const emailService = require("../utils/emailService.js");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Get price estimate for a ride
 */
const getPriceEstimate = async (req, res) => {
  try {
    const {
      pickupLocation,
      dropoffLocation,
      pickupTime,
      passengers = 1,
      luggage = 0,
      isOneWay,
    } = req.body;

    // Calculate passenger count (can be number or array length)
    const passengersCount = typeof passengers === 'number' ? passengers : (Array.isArray(passengers) ? passengers.length : 1);
    const luggageCount = luggage || 0;

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

    // Get user information for passenger details
    const userInfo = req.user ? {
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone || "", // User model doesn't have phone, but handle if added
    } : null;

    const response = await getEstimatedPrice(
      formattedPickup,
      formattedDropoff,
      formattedPickupTime,
      undefined, // Use default vehicle type
      passengerDetails,
      userInfo, // Pass user info for fallback
      passengersCount, // Pass passenger count
      luggageCount // Pass luggage count
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

        // Convert from pence to pounds
        const priceInPounds = markedUpPrice / 100;
        const originalPriceInPounds = price / 100;

        return {
          id: index + 1,
          vendorId: bid.VendorId,
          vendorName: bid.VendorName || `Vendor ${index + 1}`,
          price: parseFloat(priceInPounds.toFixed(2)),
          displayPrice: `£${priceInPounds.toFixed(2)}`,
          originalPrice: parseFloat(originalPriceInPounds.toFixed(2)),
          vehicleType: bid.VehicleType || "standard",
          estimatedArrival: new Date(
            new Date(pickupTime).getTime() + (bid.ETAInMinutes || 15) * 60000
          ),
          etaInMinutes: bid.ETAInMinutes || 15,
          currency: "GBP",
          currencySymbol: "£",
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
        return res.status(400).json({
          message: `API Error: ${
            response.AgentBidResponse.Result.FailureReason || "Unknown error"
          }`,
          code: response.AgentBidResponse.Result.FailureCode || "UNKNOWN",
        });
      }

      // For development/testing, create a mock bid to allow UI to continue working
      if (
        process.env.NODE_ENV !== "production" ||
        process.env.MOCK_MODE === "true"
      ) {
        // Generate multiple mock bids with different prices and times
        formattedResponse.quotes = [
          {
            id: 1,
            vendorId: "MOCK_VENDOR_1",
            vendorName: "Premium Taxi Service",
            price: 28.5,
            displayPrice: "£28.50",
            originalPrice: 22.8,
            vehicleType: "premium",
            estimatedArrival: new Date(
              new Date(pickupTime).getTime() + 10 * 60000
            ),
            etaInMinutes: 10,
            currency: "GBP",
            currencySymbol: "£",
          },
          {
            id: 2,
            vendorId: "MOCK_VENDOR_2",
            vendorName: "Standard Taxi Service",
            price: 21.25,
            displayPrice: "£21.25",
            originalPrice: 17.0,
            vehicleType: "standard",
            estimatedArrival: new Date(
              new Date(pickupTime).getTime() + 15 * 60000
            ),
            etaInMinutes: 15,
            currency: "GBP",
            currencySymbol: "£",
          },
          {
            id: 3,
            vendorId: "MOCK_VENDOR_3",
            vendorName: "Budget Taxi Service",
            price: 18.75,
            displayPrice: "£18.75",
            originalPrice: 15.0,
            vehicleType: "standard",
            estimatedArrival: new Date(
              new Date(pickupTime).getTime() + 20 * 60000
            ),
            etaInMinutes: 20,
            currency: "GBP",
            currencySymbol: "£",
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
// export const checkRideAvailability = async (req, res) => {
//   try {
//     const {
//       pickup,
//       dropoff,
//       time,
//       pricingModel,
//       paymentPoint,
//       vehicleType,
//       bidReference,
//     } = req.body;

//     // If we have a bid reference, use that to look up ride details
//     if (bidReference) {
//       try {
//         // Find the bid with the given reference
//         const bid = await Bid.findOne({ bidReference });

//         if (!bid) {
//           return res.status(404).json({
//             success: false,
//             message: "Bid not found with the provided reference",
//           });
//         }

//         // Check if bids have expired
//         if (new Date() > bid.expiresAt) {
//           bid.status = igoConfig.bidStatuses.UNAVAILABLE;
//           await bid.save();
//           return res.status(400).json({
//             success: false,
//             message: "Bids have expired",
//             expiresAt: bid.expiresAt,
//           });
//         }

//         // Use bid information for the availability check
//         const pickupFromBid = bid.pickup;
//         const dropoffFromBid = bid.dropoff;
//         const timeFromBid = bid.requestedTime;
//         const vehicleTypeFromBid =
//           vehicleType || igoConfig.vehicleTypes.STANDARD;

//         // Use igoConfig functions for consistent XML structure
//         const response = await sendIgoRequest(
//           igoConfig.buildXmlRequest({
//             AgentBookingAvailabilityRequest: {
//               Agent: igoConfig.buildAgentSection(),
//               Vendor: igoConfig.buildVendorSection(),
//               Journey: igoConfig.buildJourneySection({
//                 pickup: pickupFromBid,
//                 dropoff: dropoffFromBid,
//                 time: timeFromBid,
//               }),
//               VehicleType: vehicleTypeFromBid,
//               Pricing: igoConfig.buildPricingSection({
//                 pricingModel: pricingModel || PRICING_MODELS.UP_FRONT,
//                 paymentPoint: paymentPoint || PAYMENT_POINTS.TIME_OF_BOOKING,
//                 flags: [
//                   PRICING_FLAGS.ALLOW_WAITING_TIME,
//                   PRICING_FLAGS.ALLOW_EXTRAS,
//                 ],
//               }),
//               Notifications: {
//                 SMS: true,
//                 Email: true,
//               },
//             },
//           })
//         );

//         // Store the availability reference in response
//         let availabilityReference = null;
//         if (
//           response.AgentBookingAvailabilityResponse &&
//           response.AgentBookingAvailabilityResponse.AvailabilityReference
//         ) {
//           availabilityReference =
//             response.AgentBookingAvailabilityResponse.AvailabilityReference;

//           // Add it to the response so client can use it
//           response.savedAvailabilityReference = availabilityReference;
//         }

//         return res.json({
//           success: true,
//           ...response,
//           bidReference,
//         });
//       } catch (error) {
//         console.error("Error checking availability with bid reference:", error);
//         return res.status(500).json({
//           success: false,
//           message: "Error checking availability with bid reference",
//           error: error.message,
//         });
//       }
//     }

//     // Standard availability check without bid reference
//     // Validate required inputs
//     if (!pickup || !dropoff || !time) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Missing required fields: pickup, dropoff, and time are required",
//       });
//     }

//     // Use igoConfig functions for consistent XML structure
//     const response = await sendIgoRequest(
//       igoConfig.buildXmlRequest({
//         AgentBookingAvailabilityRequest: {
//           Agent: igoConfig.buildAgentSection(),
//           Vendor: igoConfig.buildVendorSection(),
//           Journey: igoConfig.buildJourneySection({ pickup, dropoff, time }),
//           VehicleType: vehicleType || igoConfig.vehicleTypes.STANDARD,
//           Pricing: igoConfig.buildPricingSection({
//             pricingModel: pricingModel || PRICING_MODELS.UP_FRONT,
//             paymentPoint: paymentPoint || PAYMENT_POINTS.TIME_OF_BOOKING,
//             flags: [
//               PRICING_FLAGS.ALLOW_WAITING_TIME,
//               PRICING_FLAGS.ALLOW_EXTRAS,
//             ],
//           }),
//           Notifications: {
//             SMS: true,
//             Email: true,
//           },
//         },
//       })
//     );

//     // Apply 25% markup to the price if available
//     if (
//       response.AgentBookingAvailabilityResponse &&
//       response.AgentBookingAvailabilityResponse.Price
//     ) {
//       const originalPrice = response.AgentBookingAvailabilityResponse.Price;
//       const markedUpPrice = originalPrice * 1.25; // Add 25%
//       response.AgentBookingAvailabilityResponse.Price = parseFloat(
//         markedUpPrice.toFixed(2)
//       );

//       // Store both original and platform prices for reference
//       response.AgentBookingAvailabilityResponse.originalPrice = originalPrice;
//       response.AgentBookingAvailabilityResponse.platformMarkup = "25%";
//     }

//     // Store the availability reference in response
//     let availabilityReference = null;
//     if (
//       response.AgentBookingAvailabilityResponse &&
//       response.AgentBookingAvailabilityResponse.AvailabilityReference
//     ) {
//       availabilityReference =
//         response.AgentBookingAvailabilityResponse.AvailabilityReference;

//       // Add it to the response so client can use it
//       response.savedAvailabilityReference = availabilityReference;
//     }

//     res.json({
//       success: true,
//       ...response,
//     });
//   } catch (error) {
//     console.error("Availability check error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Error checking ride availability",
//       error: error.message,
//     });
//   }
// };

/**
 * Book a ride
 */
const bookRide = async (req, res) => {
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
      return res.status(400).json({
        message: "Missing required fields for booking",
      });
    }

    // Validate coordinates
    if (!pickupLocation.lat || !pickupLocation.lng) {
      return res.status(400).json({
        message: "Pickup location must include lat and lng coordinates",
      });
    }

    if (!dropoffLocation.lat || !dropoffLocation.lng) {
      return res.status(400).json({
        message: "Dropoff location must include lat and lng coordinates",
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

    // Get user information for passenger details
    const currentUserForBooking = await User.findById(userObjectId);
    const userInfo = currentUserForBooking ? {
      name: currentUserForBooking.name,
      email: currentUserForBooking.email,
      phone: currentUserForBooking.phone || "", // User model doesn't have phone, but handle if added
    } : null;

    // Calculate passenger count (can be number or array length)
    const passengersCount = typeof passengers === 'number' 
      ? passengers 
      : (Array.isArray(passengers) ? passengers.length : 1);
    const luggageCount = luggage || 0;

    // Format passenger details
    let passengerDetails = Array.isArray(passengers)
      ? passengers
      : [passengers];

    // If passenger details are empty or missing name/email, populate with user info
    if (passengerDetails.length === 0 || 
        !passengerDetails[0] || 
        !passengerDetails[0].name || 
        passengerDetails[0].name === "Guest User" ||
        passengerDetails[0].name === "Default Passenger") {
      if (userInfo) {
        passengerDetails = [{
          name: userInfo.name,
          phone: userInfo.phone || "",
          email: userInfo.email,
          isLead: true,
        }];
      }
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
      pickupLocation,
      dropoffLocation,
      pickupTime: new Date(pickupTime),
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

    // Send authorization request to iGo
    const authorizationResponse = await sendRideAuthorizationRequest({
      pickupLocation,
      dropoffLocation,
      pickupTime,
      vehicleType: vehicleType || igoConfig.vehicleTypes.STANDARD,
      pricingModel: finalPricingModel,
      paymentPoint: finalPaymentPoint,
      price: markedUpPrice,
      passengers: passengerDetails,
      specialInstructions,
      availabilityReference,
      agentBookingReference,
      userInfo, // Pass user info for fallback
    });

    // Update ride with iGo booking response
    if (authorizationResponse.AgentBookingAuthorizationResponse) {
      const authResponse =
        authorizationResponse.AgentBookingAuthorizationResponse;

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
        igoResponse: authorizationResponse,
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
      igoResponse: authorizationResponse,
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
            Vendor: igoConfig.buildSingleVendorForAvailability(), // Use single Vendor
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
const getRideStatus = async (req, res) => {
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
        Vendor: igoConfig.buildSingleVendorForAvailability(), // Use single Vendor
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
const getUserRides = async (req, res) => {
  try {
    const userId = req.user?._id;
    const {
      status,
      page = 1,
      limit = 10,
      timeRange,
      sortBy = "date_desc",
    } = req.query;

    // Calculate skip for pagination (0-indexed)
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build query
    const query = { user: userId };

    // Add status filter if provided
    if (status && status !== "all") {
      query.status = status;
    }

    // Add time range filter if provided
    if (timeRange && timeRange !== "all") {
      const now = new Date();
      if (timeRange === "last_24h") {
        const cutoffDate = new Date(now);
        cutoffDate.setDate(now.getDate() - 1);
        query.createdAt = { $gte: cutoffDate };
      } else if (timeRange === "last_week") {
        const cutoffDate = new Date(now);
        cutoffDate.setDate(now.getDate() - 7);
        query.createdAt = { $gte: cutoffDate };
      } else if (timeRange === "last_month") {
        const cutoffDate = new Date(now);
        cutoffDate.setMonth(now.getMonth() - 1);
        query.createdAt = { $gte: cutoffDate };
      }
    }

    // Build sort option
    let sortOption = { createdAt: -1 }; // Default: date_desc

    if (sortBy === "date_asc") {
      sortOption = { createdAt: 1 };
    } else if (sortBy === "price_desc") {
      sortOption = { fare: -1 };
    } else if (sortBy === "price_asc") {
      sortOption = { fare: 1 };
    }

    // Get rides with pagination and sorting
    const rides = await Ride.find(query)
      .sort(sortOption)
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    // Count total rides matching the query
    const total = await Ride.countDocuments(query);

    res.json({
      rides,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
        hasMore: skip + rides.length < total,
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
const cancelRide = async (req, res) => {
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
        Vendor: igoConfig.buildSingleVendorForAvailability(), // Use single Vendor
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
const handleIgoWebhook = async (req, res) => {
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

          const billResult = await sendIgoRequest(
            igoConfig.buildXmlRequest({
              AgentBillRequest: {
                Agent: igoConfig.buildAgentSection(),
                Vendor: igoConfig.buildSingleVendorForAvailability(), // Use single Vendor
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
const requestVendorBids = async (req, res) => {
  try {
    const {
      pickupLocation,
      dropoffLocation,
      pickupTime,
      vehicleType,
      passengers,
      luggage,
      bidType = igoConfig.bidTypes.BOTH,
    } = req.body;
    console.log("the luggage is ", luggage);
    // Calculate passenger count (can be number or array length)
    const passengersCount = typeof passengers === 'number' ? passengers : (Array.isArray(passengers) ? passengers.length : 1);
    const luggageCount = luggage || 0;

    const userId = req.user?._id;

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

    // Get user information for passenger details
    const currentUser = await User.findById(userId);
    const userInfo = currentUser ? {
      name: currentUser.name,
      email: currentUser.email,
      phone: currentUser.phone || "", // User model doesn't have phone, but handle if added
    } : null;

    // Format passengers array with user info if not already provided
    let formattedPassengers = passengers;
    if (!formattedPassengers || formattedPassengers.length === 0) {
      formattedPassengers = userInfo ? [{
        name: userInfo.name,
        phone: userInfo.phone || "",
        email: userInfo.email,
        isLead: true,
      }] : [];
    }

    const bidsResponse = await requestBids(
      pickupLocation,
      dropoffLocation,
      pickupTime,
      normalizedVehicleType,
      formattedPassengers,
      userInfo, // Pass user info for fallback
      passengersCount,
      luggageCount,
    );

    const formattedBids = [];
    const rawBids = bidsResponse.AgentBidResponse?.Offers?.Offer;
    const ensureArray = (data) => (Array.isArray(data) ? data : [data]);

    for (const bid of ensureArray(rawBids)) {
      const pricing = bid.Pricing || {};
      const vendor = bid.VendorDetails || {};
      const journey = bid.EstimatedJourney || {};
      const vendorData = bid.Vendor || {};

      // Apply profit markup to pricing
      const originalPrice = parseFloat(pricing.Price || 0);
      const profitMargin = 0.25; // 25% markup
      const priceWithProfit = originalPrice * (1 + profitMargin);

      // Safely extract vendor ID (handle both attribute format and direct format)
      const vendorId = vendorData.$?.Id || vendorData.Id || "unknown";

      formattedBids.push({
        bidReference: bidsResponse.AgentBidResponse?.BidReference,
        vendorId: vendorId,
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
          price: parseFloat((priceWithProfit / 100).toFixed(2)), // Convert from pence to pounds
          displayPrice: `£${(priceWithProfit / 100).toFixed(2)}`, // Format with GBP symbol
          originalPrice: parseFloat((originalPrice / 100).toFixed(2)), // Convert from pence to pounds
          commission: parseFloat(pricing.Commission || 0),
          gratuity: parseFloat(pricing.Gratuity || 0),
          currency: pricing.Currency || "GBP",
          currencySymbol: "£",
          loyaltyCard: parseFloat(pricing.LoyaltyCard || 0),
          promotionCodeDiscount: parseFloat(pricing.PromotionCodeDiscount || 0),
          priceNET: parseFloat((priceWithProfit / 100).toFixed(2)), // Update to use price with profit in pounds
          serviceCharge: parseFloat(pricing.ServiceCharge || 0),
          VAT: parseFloat(pricing.VAT || 0),
          marketPlaceCommission: parseFloat(pricing.MarketPlaceCommission || 0),
          marketPlaceCommissionVAT: parseFloat(
            pricing.MarketPlaceCommissionVAT || 0
          ),
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

    // Determine bid status based on whether we have any successful bids
    const bidStatus = formattedBids.length > 0 
      ? igoConfig.bidStatuses.AVAILABLE 
      : igoConfig.bidStatuses.UNAVAILABLE;

    const newBid = new Bid({
      user: userId,
      bidReference: bidsResponse.AgentBidResponse?.BidReference,
      status: bidStatus,
      bidType,
      pickup: pickupLocation,
      dropoff: dropoffLocation,
      requestedTime: new Date(pickupTime),
      expiresAt,
      bids: formattedBids,
      igoResponseLog: JSON.stringify(bidsResponse),
      passengersCount,
      luggageCount,
    });

    await newBid.save();

    // Get user details for the email
    const user = await User.findById(userId);
    if (user && user.email && formattedBids.length > 0) {
      try {
        // Prepare quote details for email
        const quoteDetails = {
          pickupLocation: pickupLocation.address,
          dropoffLocation: dropoffLocation.address,
          pickupTime: new Date(pickupTime).toLocaleString(),
          numberOfQuotes: formattedBids.length,
          lowestPrice:
            formattedBids.length > 0
              ? Math.min(...formattedBids.map((bid) => bid.pricing.price))
              : 0,
          bidReference: bidsResponse.AgentBidResponse?.BidReference,
          expiresAt: expiresAt.toLocaleString(),
          vehicleType: normalizedVehicleType,
        };

        // Send quote email asynchronously
        emailService.sendQuoteEmail(user, quoteDetails).catch((error) => {
          console.error("Error sending quote email:", error);
          // Don't throw error as this shouldn't affect the API response
        });
      } catch (error) {
        console.error("Error preparing quote email:", error);
        // Don't throw error as this shouldn't affect the API response
      }
    }

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

const authorizeBooking = async (req, res) => {
  try {
    const {
      bidReference,
      pickupLocation,
      dropoffLocation,
      pickupTime,
      vehicleType,
      pricingModel,
      paymentPoint,
      price,
      passengers,
      specialInstructions,
      availabilityReference,
      agentBookingReference,
    } = req.body;
    console.log("the req.body is ", req.body);
    const userId = req.user?._id;

    // Validate required fields
    if (!availabilityReference) {
      return res
        .status(400)
        .json({ error: "Availability reference is required" });
    }

    // Fetch the bid to get location data if not provided in request
    const bid = await Bid.findOne({ bidReference, user: userId });

    if (!bid) {
      return res.status(404).json({
        success: false,
        message: "Bid not found",
      });
    }

    // Use location from request body, or fallback to bid location data
    const finalPickupLocation = pickupLocation || bid.pickup;
    const finalDropoffLocation = dropoffLocation || bid.dropoff;
    const finalPickupTime = pickupTime || bid.requestedTime;

    // Validate location coordinates
    if (!finalPickupLocation || !finalPickupLocation.lat || !finalPickupLocation.lng) {
      return res.status(400).json({
        error: "Pickup location must include lat and lng coordinates",
      });
    }

    if (!finalDropoffLocation || !finalDropoffLocation.lat || !finalDropoffLocation.lng) {
      return res.status(400).json({
        error: "Dropoff location must include lat and lng coordinates",
      });
    }

    // Get user information for passenger details
    const currentUserForAuth = await User.findById(userId);
    const userInfo = currentUserForAuth ? {
      name: currentUserForAuth.name,
      email: currentUserForAuth.email,
      phone: currentUserForAuth.phone || "", // User model doesn't have phone, but handle if added
    } : null;

    // Format passengers array - use provided passengers or create from user info
    let formattedPassengers = passengers;
    if (!formattedPassengers || formattedPassengers.length === 0) {
      formattedPassengers = userInfo ? [{
        name: userInfo.name,
        phone: userInfo.phone || "",
        email: userInfo.email,
        isLead: true,
      }] : [];
    }

    // Send the XML to iGo
    const igoResponse = await sendRideAuthorizationRequest({
      pickupLocation: finalPickupLocation,
      dropoffLocation: finalDropoffLocation,
      pickupTime: finalPickupTime,
      vehicleType,
      pricingModel,
      paymentPoint,
      price,
      passengers: formattedPassengers,
      specialInstructions,
      availabilityReference,
      agentBookingReference,
      userInfo, // Pass user info for fallback
    });

    // Update bid with authorization reference (bid already validated above)
    bid.authorizationReference =
      igoResponse.AgentBookingAuthorizationResponse.AuthorizationReference;
    await bid.save();

    // Create a new ride record from the bid and authorization data
    if (
      igoResponse.AgentBookingAuthorizationResponse.Result.Success === "true"
    ) {
      // Get the selected bid information
      const selectedBid = bid.selectedBid;
      if (!selectedBid) {
        console.error("No selected bid found in the bid document");
      }

      // Format locations to match Ride schema (use final locations from above)
      const formattedPickupLocation = {
        address: finalPickupLocation.address,
        latitude: finalPickupLocation.lat,
        longitude: finalPickupLocation.lng,
      };

      const formattedDropoffLocation = {
        address: finalDropoffLocation.address,
        latitude: finalDropoffLocation.lat,
        longitude: finalDropoffLocation.lng,
      };

      // Calculate price with markup if available
      const originalPrice = price || selectedBid?.pricing?.priceNET || 0;
      const markedUpPrice = parseFloat((originalPrice * 1.25).toFixed(2));

      // Create passenger information using userInfo passed from above
      let passengerDetails = [];
      if (Array.isArray(passengers) && passengers.length > 0) {
        passengerDetails = passengers;
      } else if (passengers && typeof passengers === "number") {
        // If passengers is just a number, use userInfo
        if (userInfo) {
          passengerDetails.push({
            name: userInfo.name || "Unknown",
            phone: userInfo.phone || "",
            email: userInfo.email || "Unknown",
            isLead: true,
          });
        }
      } else {
        // Default passenger from userInfo
        if (userInfo) {
          passengerDetails.push({
            name: userInfo.name || "Unknown",
            phone: userInfo.phone || "",
            email: userInfo.email || "Unknown",
            isLead: true,
          });
        }
      }

      // Create new ride
      const newRide = new Ride({
        user: userId,
        pickupLocation: formattedPickupLocation,
        dropoffLocation: formattedDropoffLocation,
        pickupTime: new Date(finalPickupTime),
        fare: markedUpPrice,
        originalFare: originalPrice,
        status: igoConfig.rideStatuses.BOOKED,
        pricingModel: pricingModel || "FixedPrice",
        paymentPoint: paymentPoint || "TimeOfBooking",
        passengers: passengerDetails,
        specialInstructions: specialInstructions || "",
        vehicleType: vehicleType || igoConfig.vehicleTypes.STANDARD,
        igoAvailabilityReference: availabilityReference,
        igoAuthorizationReference:
          igoResponse.AgentBookingAuthorizationResponse.AuthorizationReference,
        igoBookingId: agentBookingReference,
        bookedAt: new Date(),
        // Store the response logs
        igoResponseLogs: [
          {
            timestamp: new Date(),
            requestType: "authorization",
            response: igoResponse.AgentBookingAuthorizationResponse,
          },
        ],
      });

      // Save the ride
      await newRide.save();
    }

    console.log(
      "the igoResponse is ",
      igoResponse.AgentBookingAuthorizationResponse
    );
    res.status(200).json({
      success: igoResponse.AgentBookingAuthorizationResponse.Result.Success,
      response: igoResponse,
      agentBookingReference: agentBookingReference,
    });
  } catch (error) {
    console.error("iGo Authorization Error:", error);
    res.status(500).json({
      success: false,
      message: "Authorization request failed",
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
const getBidsByReference = async (req, res) => {
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
const selectBid = async (req, res) => {
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

    // Get user information for passenger details
    const currentUserForSelect = await User.findById(userId);
    const userInfo = currentUserForSelect ? {
      name: currentUserForSelect.name,
      email: currentUserForSelect.email,
      phone: currentUserForSelect.phone || "", // User model doesn't have phone, but handle if added
    } : null;

    // Proceed with availability check using the selected bid - use checkAvailability directly from imports
    // Pass quotedPrice from the selected bid (required for AgentBookingAvailabilityRequest)
    // Retrieve passenger and luggage counts from bid to maintain consistency with bid request
    const quotedPrice = selectedBid.pricing?.estimatedPrice || selectedBid.pricing?.price || null;
    const passengersCount = bid.passengersCount || 1;
    const luggageCount = bid.luggageCount || 0;
    
    const availabilityResponse = await checkAvailability(
      bid.pickup,
      bid.dropoff,
      bid.requestedTime,
      bid.bidReference,
      normalizeVehicleType(selectedBid.vehicleType), // Normalize vehicle type for API request
      [], // Passengers array (will use userInfo if empty)
      quotedPrice, // Pass quoted price from bid
      userInfo, // Pass user info for passenger details
      passengersCount, // Pass passenger count from bid to maintain consistency
      luggageCount // Pass luggage count from bid to maintain consistency
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
      pricing: {
        currency: selectedBid.pricing.currency,
        minimumPrice: selectedBid.pricing.minimumPrice,
        maximumPrice: selectedBid.pricing.maximumPrice,
        estimatedPrice: selectedBid.pricing.estimatedPrice,
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
const processPayment = async (req, res) => {
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
          Vendor: igoConfig.buildSingleVendorForAvailability(), // Use single Vendor
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
const requestBill = async (req, res) => {
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
          Vendor: igoConfig.buildSingleVendorForAvailability(), // Use single Vendor
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
const getReceipt = async (req, res) => {
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
          Vendor: igoConfig.buildSingleVendorForAvailability(), // Use single Vendor
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

module.exports = {
  getPriceEstimate,
  bookRide,
  getRideStatus,
  cancelRide,
  handleIgoWebhook,
  getUserRides,
  requestVendorBids,
  getBidsByReference,
  selectBid,
  processPayment,
  requestBill,
  getReceipt,
  authorizeBooking,
};
