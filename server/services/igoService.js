import axios from "axios";
import { parseStringPromise, Builder } from "xml2js";
import Ride from "../models/Ride.js";
import igoConfig from "../config/igoConfig.js";
import { sendRideStatusNotification } from "./notificationService.js";
import {
  emitRideUpdate,
  emitDriverLocation,
  emitPaymentUpdate,
} from "./socketService.js";
import EventHistory from "../models/EventHistory.js";

// Update to determine if we should use mock mode
// We'll disable mock mode if we have a webhook URL configured (ngrok)
const shouldUseMockMode = () => {
  // If explicitly set to false, respect that
  if (process.env.MOCK_MODE === "false") {
    return false;
  }

  // If we have a webhook URL configured, use real mode by default
  if (process.env.API_BASE_URL && process.env.API_BASE_URL.includes("ngrok")) {
    console.log("ngrok webhook URL detected, using real iGo API mode");
    return false;
  }

  // Default to mock mode for development
  return true;
};

// Pricing models and payment points
export const PRICING_MODELS = igoConfig.pricingModels;
export const PAYMENT_POINTS = igoConfig.paymentPoints;
export const PRICING_FLAGS = igoConfig.pricingFlags;

/**
 * Send a request to the iGo API with XML payload.
 * Basic version without retries.
 */
const sendIgoRequestBasic = async (xmlBody) => {
  try {
    // Log outgoing requests in development
    if (!igoConfig.isProduction) {
      console.log("iGo API Request:", xmlBody);
    }

    // Determine if we should use mock mode
    const useMockMode = shouldUseMockMode();

    // Use mock response in mock mode
    if (useMockMode) {
      console.log("MOCK MODE: Returning mock response");
      const mockResponse = getMockResponse(xmlBody);

      // Log mock response
      if (!igoConfig.isProduction) {
        console.log(
          "iGo API Mock Response:",
          JSON.stringify(mockResponse, null, 2)
        );
      }

      return mockResponse;
    }

    // We're using real mode, send actual request to iGo API
    console.log(`Sending request to iGo API at ${igoConfig.apiUrl}`);

    const response = await axios.post(igoConfig.apiUrl, xmlBody, {
      headers: {
        "Content-Type": "application/xml",
        "X-Authorization-Reference": `${igoConfig.agentId}:${igoConfig.agentPassword}`,
        "X-Agent-Booking-Reference": igoConfig.vendorId,
      },
      timeout: igoConfig.apiTimeout,
    });

    // Parse XML response to JSON
    const parsedResponse = await parseStringPromise(response.data, {
      explicitArray: false, // Don't create arrays for single elements
      ignoreAttrs: false, // Ignore XML attributes
      trim: true, // Trim whitespace
    });

    // Log responses in development
    if (!igoConfig.isProduction) {
      console.log("iGo API Response:", JSON.stringify(parsedResponse, null, 2));
    }

    // Check for error responses
    if (parsedResponse.Error) {
      throw new Error(
        `iGo API Error: ${parsedResponse.Error.Message || "Unknown error"}`
      );
    }

    return parsedResponse;
  } catch (error) {
    console.error("iGo API Request Error:", error.message);

    // Check if we're in mock mode and should fall back to mock response
    if (!shouldUseMockMode() && process.env.FALLBACK_TO_MOCK === "true") {
      console.log("Error in real mode, falling back to mock response");
      return getMockResponse(xmlBody);
    }

    throw error;
  }
};

/**
 * Send a request to the iGo API with retry logic for production reliability.
 * This function will retry failed requests based on configuration.
 *
 * @param {string} xmlBody - The XML body to send to the iGo API
 * @param {Object} options - Options for the retry logic
 * @param {number} options.maxRetries - Maximum number of retry attempts (default: 3)
 * @param {number} options.baseDelay - Base delay between retries in ms (default: 1000)
 * @param {boolean} options.exponentialBackoff - Whether to use exponential backoff (default: true)
 * @returns {Promise<Object>} The parsed response from the iGo API
 */
export const sendIgoRequest = async (xmlBody, options = {}) => {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    exponentialBackoff = true,
  } = options;

  let attempts = 0;
  let lastError = null;

  // Critical operations that should always be retried
  const isCriticalOperation = (xml) => {
    return (
      xml.includes("AgentBookingAuthorizationRequest") || // Booking confirmation
      xml.includes("AgentPaymentRequest") || // Payment processing
      xml.includes("AgentBookingCancellationRequest") // Booking cancellation
    );
  };

  // Determine if this operation should use retry logic
  const shouldRetry = isCriticalOperation(xmlBody);

  // If not a critical operation, just send once
  if (!shouldRetry) {
    return sendIgoRequestBasic(xmlBody);
  }

  // For critical operations, use retry logic
  while (attempts <= maxRetries) {
    try {
      return await sendIgoRequestBasic(xmlBody);
    } catch (error) {
      lastError = error;
      attempts++;

      if (attempts > maxRetries) {
        console.error(
          `All ${maxRetries} retry attempts failed for iGo API request`
        );
        break;
      }

      // Calculate delay with optional exponential backoff
      const delay = exponentialBackoff
        ? baseDelay * Math.pow(2, attempts - 1)
        : baseDelay;

      console.log(
        `Retry attempt ${attempts}/${maxRetries} after ${delay}ms...`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // All retries failed
  throw lastError;
};

/**
 * Generate mock responses for testing without the real iGo API
 */
// function getMockResponse(xmlBody) {
//   const mockAvailabilityRef = "MOCK_AVAIL_" + Date.now();
//   const mockAuthRef = "MOCK_AUTH_" + Date.now();

//   // Extract any existing availability reference from the request
//   let availabilityRef = extractAvailabilityRef(xmlBody);

//   if (xmlBody.includes("AgentPriceEstimateRequest")) {
//     return {
//       AgentPriceEstimateResponse: {
//         Price: 25.5,
//         Currency: "USD",
//         EstimatedTime: 15,
//       },
//     };
//   } else if (xmlBody.includes("AgentBookingAvailabilityRequest")) {
//     return {
//       AgentBookingAvailabilityResponse: {
//         AvailabilityReference: mockAvailabilityRef,
//         Available: true,
//         EstimatedTime: 10,
//         // Include this so the client can store it for subsequent requests
//         savedAvailabilityReference: mockAvailabilityRef,
//       },
//     };
//   } else if (xmlBody.includes("AgentBookingAuthorizationRequest")) {
//     return {
//       AgentBookingAuthorizationResponse: {
//         AuthorizationReference: mockAuthRef,
//         Status: "Booked",
//         EstimatedTime: 10,
//         AvailabilityReference: availabilityRef || "DefaultAvailRef",
//       },
//     };
//   } else if (xmlBody.includes("AgentBookingStatusRequest")) {
//     return {
//       AgentBookingStatusResponse: {
//         Status: "Dispatched",
//         BookingTime: new Date().toISOString(),
//         EstimatedArrivalTime: new Date(Date.now() + 10 * 60000).toISOString(),
//       },
//     };
//   } else if (xmlBody.includes("AgentBookingCancellationRequest")) {
//     return {
//       AgentBookingCancellationResponse: {
//         Status: "Cancelled",
//         CancellationTime: new Date().toISOString(),
//       },
//     };
//   } else if (xmlBody.includes("AgentBidRequest")) {
//     return {
//       AgentBidResponse: {
//         Status: "OK",
//         BidReference: `BID_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
//         Bids: {
//           Bid: [
//             {
//               VendorId: "VENDOR_1",
//               VendorName: "Premium Taxis",
//               PriceBand: {
//                 Currency: "GBP",
//                 MinimumPrice: "18.00",
//                 MaximumPrice: "28.00",
//                 EstimatedPrice: "23.00",
//               },
//               ETAInMinutes: "8",
//               VehicleType: igoConfig.vehicleTypes.EXECUTIVE,
//             },
//             {
//               VendorId: "VENDOR_2",
//               VendorName: "Budget Cabs",
//               PriceBand: {
//                 Currency: "GBP",
//                 MinimumPrice: "12.00",
//                 MaximumPrice: "20.00",
//                 EstimatedPrice: "16.00",
//               },
//               ETAInMinutes: "15",
//               VehicleType: igoConfig.vehicleTypes.STANDARD,
//             },
//           ],
//         },
//       },
//     };
//   } else if (xmlBody.includes("AgentPaymentRequest")) {
//     return {
//       AgentPaymentResponse: {
//         Status: "Accepted",
//         AuthorizationReference: extractAuthRef(xmlBody) || "MOCK_AUTH_REF",
//         PaymentReference: `PAY_${Date.now()}`,
//         TransactionTime: new Date().toISOString(),
//         ReceiptAvailable: true,
//       },
//     };
//   } else if (xmlBody.includes("AgentBillRequest")) {
//     return {
//       AgentBillResponse: {
//         Status: "OK",
//         AuthorizationReference: extractAuthRef(xmlBody) || "MOCK_AUTH_REF",
//         BillItems: {
//           BillItem: [
//             {
//               Description: "Base fare",
//               Amount: "15.50",
//               Type: "Fare",
//             },
//             {
//               Description: "Waiting time",
//               Amount: "2.50",
//               Type: "Extra",
//             },
//             {
//               Description: "Airport fee",
//               Amount: "3.00",
//               Type: "Fee",
//             },
//           ],
//         },
//         SubTotal: "21.00",
//         Tax: "4.20",
//         Total: "25.20",
//         Currency: "GBP",
//         PaymentStatus: "Pending",
//       },
//     };
//   } else if (xmlBody.includes("AgentReceiptRequest")) {
//     return {
//       AgentReceiptResponse: {
//         Status: "OK",
//         AuthorizationReference: extractAuthRef(xmlBody) || "MOCK_AUTH_REF",
//         VendorName: "Test Taxi Company",
//         ReceiptNumber: `RCPT-${Date.now()}`,
//         BookingReference: `BOOKING_${Date.now()}`,
//         PaymentReference: `PAY_${Date.now() - 1000}`,
//         JourneyDetails: {
//           StartTime: new Date(Date.now() - 3600000).toISOString(),
//           EndTime: new Date(Date.now() - 600000).toISOString(),
//           PickupAddress: "123 Pickup Street, London",
//           DropoffAddress: "456 Dropoff Avenue, London",
//           Distance: "5.2 miles",
//         },
//         BillItems: {
//           BillItem: [
//             {
//               Description: "Base fare",
//               Amount: "15.50",
//               Type: "Fare",
//             },
//             {
//               Description: "Waiting time",
//               Amount: "2.50",
//               Type: "Extra",
//             },
//             {
//               Description: "Airport fee",
//               Amount: "3.00",
//               Type: "Fee",
//             },
//           ],
//         },
//         SubTotal: "21.00",
//         Tax: "4.20",
//         Total: "25.20",
//         Currency: "GBP",
//         PaymentMethod: "Card",
//         PaymentTime: new Date(Date.now() - 500000).toISOString(),
//         ReceiptURL: "https://mock-taxi-company.com/receipts/RCPT-12345.pdf",
//       },
//     };
//   }

//   return { MockResponse: "Unknown request type" };
// }

/**
 * Extract availability reference from XML request body
 */
function extractAvailabilityRef(xmlBody) {
  // Simple regex to extract availability reference
  const match = xmlBody.match(
    /<AvailabilityReference>([^<]+)<\/AvailabilityReference>/
  );
  return match ? match[1] : null;
}

/**
 * Extract authorization reference from XML request body
 */
function extractAuthRef(xmlBody) {
  // Simple regex to extract authorization reference
  const match = xmlBody.match(
    /<AuthorizationReference>([^<]+)<\/AuthorizationReference>/
  );
  return match ? match[1] : null;
}

/**
 * Convert JSON to XML.
 */
export const buildXmlRequest = (jsonData) => {
  const builder = new Builder({
    headless: true,
    renderOpts: {
      pretty: true,
      indent: "  ",
      newline: "\n",
    },
  });
  return builder.buildObject(jsonData);
};

/**
 * Build the common Agent section for all requests
 */
export const buildAgentSection = () => ({
  Id: igoConfig.agentId,
  Password: igoConfig.agentPassword,
  Reference: `AgentRef_${Date.now()}`,
  Time: new Date().toISOString(),
});

/**
 * Build the common Vendor section for all requests
 */
export const buildVendorSection = () => ({
  Id: igoConfig.vendorId,
});

/**
 * Build pricing section for booking requests
 */
export const buildPricingSection = ({
  pricingModel = PRICING_MODELS.UP_FRONT,
  paymentPoint = PAYMENT_POINTS.TIME_OF_BOOKING,
  price,
  flags = [],
}) => {
  const pricingObj = {
    PricingModel: pricingModel,
    PaymentPoint: paymentPoint,
  };

  // Add price only if it's provided and not undefined
  if (price !== undefined) {
    pricingObj.Price = price;
  }

  // Add flags if there are any
  if (flags && flags.length > 0) {
    pricingObj.PricingFlags = { Flag: flags };
  }

  return pricingObj;
};

/**
 * Handle incoming iGo events
 */
export const handleIgoEvent = async (eventType, eventData) => {
  try {
    const eventRoot = eventData[eventType]; // Access the root element
    const authRef = eventRoot.AuthorizationReference;

    console.log(
      `Received iGo event: ${eventType} \n`,
      eventRoot.AuthorizationReference
    );

    // Parse booking reference from the event data
    let bookingId;

    // Extract the booking reference based on event type
    if (eventType === igoConfig.eventTypes.DISPATCHED) {
      bookingId = eventRoot.AuthorizationReference;
    } else if (eventType === igoConfig.eventTypes.COMPLETED) {
      bookingId = eventRoot.AuthorizationReference;
    } else if (eventType === igoConfig.eventTypes.CANCELLED) {
      bookingId = eventRoot.AuthorizationReference;
    } else if (eventType === igoConfig.eventTypes.FAILED) {
      bookingId = eventRoot.AuthorizationReference;
    } else if (eventType === igoConfig.eventTypes.DRIVER_ASSIGNED) {
      bookingId = eventRoot.AuthorizationReference;
    } else if (eventType === igoConfig.eventTypes.DRIVER_ARRIVED) {
      bookingId = eventRoot.AuthorizationReference;
    } else if (eventType === igoConfig.eventTypes.JOURNEY_STARTED) {
      bookingId = eventRoot.AuthorizationReference;
    } else if (eventType === igoConfig.eventTypes.JOURNEY_COMPLETED) {
      bookingId = eventRoot.AuthorizationReference;
    } else {
      console.warn(`Unhandled event type: ${eventType}`);
      return { status: "ignored", message: "Unhandled event type" };
    }

    if (!bookingId) {
      return {
        status: "error",
        message: "Missing booking reference in event data",
      };
    }

    // Find the ride in the database
    const ride = await Ride.findOne({ igoAuthorizationReference: bookingId });

    if (!ride) {
      return {
        status: "error",
        message: `Ride with booking ID ${bookingId} not found`,
      };
    }

    // Update ride with event data
    ride.updateFromIgoEvent(eventType, eventData);
    await ride.save();

    // Process event based on type
    switch (eventType) {
      case igoConfig.eventTypes.DISPATCHED:
        return await handleBookingDispatched(ride, eventData);
      case igoConfig.eventTypes.COMPLETED:
        return await handleBookingCompleted(ride, eventData);
      case igoConfig.eventTypes.CANCELLED:
        return await handleBookingCancelled(ride, eventData);
      case igoConfig.eventTypes.FAILED:
        return await handleBookingFailed(ride, eventData);
      case igoConfig.eventTypes.DRIVER_ASSIGNED:
        return await handleDriverAssigned(ride, eventData);
      case igoConfig.eventTypes.DRIVER_ARRIVED:
        return await handleDriverArrived(ride, eventData);
      case igoConfig.eventTypes.JOURNEY_STARTED:
        return await handleJourneyStarted(ride, eventData);
      case igoConfig.eventTypes.JOURNEY_COMPLETED:
        return await handleJourneyCompleted(ride, eventData);
      default:
        return { status: "ignored", message: "Unhandled event type" };
    }
  } catch (error) {
    console.error(`Error handling iGo event ${eventType}:`, error);
    return {
      status: "error",
      message: error.message,
    };
  }
};

/**
 * Get estimated price for a ride (AgentPriceRequest)
 */
export const getEstimatedPrice = async (
  pickupLocation,
  dropoffLocation,
  pickupTime,
  vehicleType = igoConfig.vehicleTypes.STANDARD,
  passengers = []
) => {
  try {
    const passengerDetails =
      passengers.length > 0
        ? passengers
        : [
            {
              name: "Default Passenger",
              phone: "",
              email: "",
              isLead: true,
            },
          ];

    // Format pickup time
    const bookingTime = new Date(pickupTime).toISOString();

    // Map vehicle type to appropriate category and type enums
    let vehicleCategory = igoConfig.vehicleCategories.STANDARD;
    let vehicleTypeEnum = igoConfig.vehicleTypeEnums.SALOON;

    // Map the vehicle type to the appropriate category and type
    if (vehicleType === igoConfig.vehicleTypes.EXECUTIVE) {
      vehicleCategory = igoConfig.vehicleCategories.EXECUTIVE;
    } else if (vehicleType === igoConfig.vehicleTypes.LUXURY) {
      vehicleCategory = igoConfig.vehicleCategories.LUXURY;
    } else if (vehicleType === igoConfig.vehicleTypes.MINIBUS) {
      vehicleTypeEnum = igoConfig.vehicleTypeEnums.MINIBUS;
    }

    const xmlRequest = {
      AgentPriceRequest: {
        Agent: igoConfig.buildAgentSection(),
        Vendor: igoConfig.buildVendorSection(),
        PriceParameters: {
          Source: "Other",
          BookingTimeMode: "Fixed",
          BookingTime: bookingTime,
          Availability: "Any",
          ...igoConfig.buildPassengerSection(passengerDetails),

          Pricing: {
            Currency: "GBP",
            PaymentType: "Account",
            PaymentPoint: igoConfig.paymentPoints.TIME_OF_BOOKING,
            MarketPlace: "IGO",
          },

          Journey: igoConfig.buildJourneySection({
            pickup: pickupLocation,
            dropoff: dropoffLocation,
            time: pickupTime,
          }),

          Ride: {
            Type: "Passenger",
            Count: (passengers.length || 1).toString(),
            VehicleType: vehicleTypeEnum,
            VehicleCategory: vehicleCategory,
          },
        },
      },
    };

    const xmlString = igoConfig.buildXmlRequest(xmlRequest);
    console.log("Sending price request to iGo:", xmlString);

    const response = await sendIgoRequest(xmlString);
    console.log("Received price response from iGo:", response);
    return response;
  } catch (error) {
    console.error("Price request error:", error);
    throw error;
  }
};

/**
 * Check ride availability
 */
export const checkAvailability = async (
  pickupLocation,
  dropoffLocation,
  pickupTime,
  bidReference,
  vehicleType = igoConfig.vehicleTypes.STANDARD,
  passengers = []
) => {
  try {
    const passengerDetails =
      passengers.length > 0
        ? passengers
        : [
            {
              name: "Default Passenger",
              phone: "",
              email: "",
              isLead: true,
            },
          ];
    console.log(
      "Checking availability with bid reference:",
      bidReference,
      "and vehicle type:",
      vehicleType
    );

    // Map vehicle type to appropriate category and type enums
    let vehicleCategory = igoConfig.vehicleCategories.STANDARD;
    let vehicleTypeEnum = igoConfig.vehicleTypeEnums.SALOON;

    // Map the vehicle type to the appropriate category and type
    if (vehicleType === igoConfig.vehicleTypes.EXECUTIVE) {
      vehicleCategory = igoConfig.vehicleCategories.EXECUTIVE;
    } else if (vehicleType === igoConfig.vehicleTypes.LUXURY) {
      vehicleCategory = igoConfig.vehicleCategories.LUXURY;
    } else if (vehicleType === igoConfig.vehicleTypes.MINIBUS) {
      vehicleTypeEnum = igoConfig.vehicleTypeEnums.MINIBUS;
    }

    const xmlRequest = igoConfig.buildXmlRequest({
      AgentBookingAvailabilityRequest: {
        Agent: igoConfig.buildAgentSection(),
        Vendor: igoConfig.buildVendorSection(),
        BidReference: bidReference,
        BookingParameters: {
          Journey: igoConfig.buildJourneySection({
            pickup: pickupLocation,
            dropoff: dropoffLocation,
            time: pickupTime,
          }),
          VehicleCategory: vehicleCategory,
          Pricing: igoConfig.buildPricingSection({
            pricingModel: igoConfig.pricingModels.UP_FRONT,
            paymentPoint: igoConfig.paymentPoints.TIME_OF_BOOKING,
            flags: [
              igoConfig.pricingFlags.ALLOW_WAITING_TIME,
              igoConfig.pricingFlags.ALLOW_EXTRAS,
              igoConfig.pricingFlags.ALLOW_TOLLS,
              igoConfig.pricingFlags.ALLOW_PARKING,
            ],
          }),
          Ride: {
            Type: "Passenger",
            Count: (passengers.length || 1).toString(),
            VehicleType: vehicleTypeEnum,
            VehicleCategory: vehicleCategory,
          },
        },
      },
    });

    // console.log("Sending availability request to iGo:", xmlRequest);

    const response = await sendIgoRequest(xmlRequest);
    return response;
  } catch (error) {
    console.error("Availability check error:", error);
    throw error;
  }
};

/**
 * Book a ride
 */
export const sendRideAuthorizationRequest = async ({
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
}) => {
  try {
    const passengerDetails =
      passengers.length > 0
        ? passengers
        : [
            {
              name: "Default Passenger",
              phone: "",
              email: "",
              isLead: true,
            },
          ];
    const xmlRequest = igoConfig.buildXmlRequest({
      AgentBookingAuthorizationRequest: {
        Agent: igoConfig.buildAgentSection(),
        Vendor: igoConfig.buildVendorSection(),
        AvailabilityReference: availabilityReference,
        AgentBookingReference:
          agentBookingReference || igoConfig.generateBookingReference(),
        AvailabilityReference: availabilityReference,
        Journey: igoConfig.buildJourneySection({
          pickup: pickupLocation,
          dropoff: dropoffLocation,
          time: pickupTime,
        }),
        VehicleType: igoConfig.vehicleTypeEnums.SALOON,
        VehicleCategory: igoConfig.vehicleCategories.STANDARD,
        Pricing: igoConfig.buildPricingSection({
          pricingModel,
          paymentPoint,
          price,
          flags: [
            igoConfig.pricingFlags.ALLOW_WAITING_TIME,
            igoConfig.pricingFlags.ALLOW_EXTRAS,
            igoConfig.pricingFlags.ALLOW_TOLLS,
            igoConfig.pricingFlags.ALLOW_PARKING,
          ],
        }),
        Passengers: igoConfig.buildPassengerSection(passengerDetails),
        DriverNote: specialInstructions || "",
        Notifications: {
          SMS: true,
          Email: true,
        },
      },
    });

    const response = await sendIgoRequest(xmlRequest);
    return response;
  } catch (error) {
    console.error("Booking error:", error);
    throw error;
  }
};

/**
 * Get ride status
 */
export const getRideStatus = async (authorizationReference) => {
  try {
    const xmlRequest = igoConfig.buildXmlRequest({
      AgentBookingStatusRequest: {
        Agent: igoConfig.buildAgentSection(),
        Vendor: igoConfig.buildVendorSection(),
        AuthorizationReference: authorizationReference,
      },
    });

    const response = await sendIgoRequest(xmlRequest);
    return response;
  } catch (error) {
    console.error("Status check error:", error);
    throw error;
  }
};

/**
 * Cancel a ride
 */
export const cancelRide = async (
  authorizationReference,
  cancellationReason
) => {
  try {
    const xmlRequest = igoConfig.buildXmlRequest({
      AgentBookingCancellationRequest: {
        Agent: igoConfig.buildAgentSection(),
        Vendor: igoConfig.buildVendorSection(),
        AuthorizationReference: authorizationReference,
        CancellationReason: cancellationReason,
      },
    });

    const response = await sendIgoRequest(xmlRequest);
    return response;
  } catch (error) {
    console.error("Cancellation error:", error);
    throw error;
  }
};

// Event handlers
const handleBookingDispatched = async (ride, eventData) => {
  try {
    console.log(
      "in the specified event handler" + " which is handleBookingDispatched"
    );
    // Update ride with dispatch information
    ride.status = igoConfig.rideStatuses.DISPATCHED;
    ride.dispatchedAt = new Date();

    // Extract driver and vehicle information if available
    if (eventData.Driver) {
      ride.driverDetails = {
        name: eventData.Driver.ForeName + " " + eventData.Driver.Surname,
        phone: eventData.Driver.MobileNumber,
        vehicleDetails: eventData.Driver.Vehicle,
      };
    }
    console.log("and the event data is", eventData.AgentBookingDispatchedEventRequest.BookingReference);

    await ride.save();

    // Send notification to user about dispatch
    await sendRideStatusNotification(ride, "booking.dispatched", eventData);

    // store the booking refference for emiting the event.

    const bookingRef = eventData.AgentBookingDispatchedEventRequest.BookingReference;

    // Emit socket event
    emitRideUpdate(bookingRef, {
      status: ride.status,
      dispatchedAt: ride.dispatchedAt,
      driverDetails: ride.driverDetails,
    });

    // Store event in history
    await storeEventInHistory(igoConfig.eventTypes.DISPATCHED, eventData, ride);

    return {
      status: "processed",
      message: "Booking dispatched",
      rideId: ride._id,
    };
  } catch (error) {
    console.error("Error handling booking dispatch:", error);
    return { status: "error", message: error.message };
  }
};

const handleBookingCompleted = async (ride, eventData) => {
  try {
    console.log(
      "in the specified event handler" + " which is handleBookingCompleted"
    );
    // Update ride with completion information
    ride.status = igoConfig.rideStatuses.COMPLETED;
    ride.completedAt = new Date();

    // Update final fare if available
    if (eventData.FinalFare) {
      ride.fare = parseFloat(eventData.FinalFare);
    }

    await ride.save();

    // Send notification to user about completion
    await sendRideStatusNotification(ride, "booking.completed", eventData);

    // Store event in history
    await storeEventInHistory(igoConfig.eventTypes.COMPLETED, eventData, ride);

    return {
      status: "processed",
      message: "Booking completed",
      rideId: ride._id,
    };
  } catch (error) {
    console.error("Error handling booking completion:", error);
    return { status: "error", message: error.message };
  }
};

const handleBookingCancelled = async (ride, eventData) => {
  try {
    console.log(
      "in the specified event handler" + " which is handleBookingCancelled"
    );
    // Update ride with cancellation information
    ride.status = igoConfig.rideStatuses.CANCELLED;
    ride.cancelledAt = new Date();
    ride.cancellationReason = eventData.Reason || "Cancelled via iGo";

    await ride.save();

    // Send notification to user about cancellation
    await sendRideStatusNotification(ride, "booking.cancelled", eventData);

    // Emit socket event
    emitRideUpdate(ride._id, {
      status: ride.status,
      cancelledAt: ride.cancelledAt,
      cancellationReason: ride.cancellationReason,
    });

    // Store event in history
    await storeEventInHistory(igoConfig.eventTypes.CANCELLED, eventData, ride);

    return {
      status: "processed",
      message: "Booking cancelled",
      rideId: ride._id,
    };
  } catch (error) {
    console.error("Error handling booking cancellation:", error);
    return { status: "error", message: error.message };
  }
};

const handleBookingFailed = async (ride, eventData) => {
  try {
    console.log(
      "in the specified event handler" + " which is handleBookingFailed"
    );
    // Update ride with failure information
    ride.status = igoConfig.rideStatuses.FAILED;
    ride.failedAt = new Date();
    ride.failureReason = eventData.Reason || "Failed via iGo";

    await ride.save();

    // Send notification to user about failure
    await sendRideStatusNotification(ride, "booking.failed", eventData);

    // Emit socket event
    emitRideUpdate(ride._id, {
      status: ride.status,
      failedAt: ride.failedAt,
      failureReason: ride.failureReason,
    });

    // Store event in history
    await storeEventInHistory(igoConfig.eventTypes.FAILED, eventData, ride);

    return {
      status: "processed",
      message: "Booking failed",
      rideId: ride._id,
    };
  } catch (error) {
    console.error("Error handling booking failure:", error);
    return { status: "error", message: error.message };
  }
};

const handleDriverAssigned = async (ride, eventData) => {
  try {
    console.log(
      "in the specified event handler" + " which is handleDriverAssigned"
    );
    // Update ride with driver information
    ride.status = igoConfig.rideStatuses.DRIVER_ASSIGNED;
    ride.driverAssignedAt = new Date();
    ride.driverDetails = {
      name: eventData.Driver?.Name,
      phone: eventData.Driver?.TelephoneNumber,
      vehicleDetails: eventData.Driver?.VehicleDetails,
      licenseNumber: eventData.Driver?.LicenseNumber,
      photo: eventData.Driver?.Photo,
      rating: eventData.Driver?.Rating,
    };
    ride.estimatedArrivalTime = eventData.EstimatedArrivalTime
      ? new Date(eventData.EstimatedArrivalTime)
      : null;

    await ride.save();

    // Send notification
    await sendRideStatusNotification(
      ride,
      "booking.driver_assigned",
      eventData
    );

    // Emit socket event
    emitRideUpdate(ride._id, {
      status: ride.status,
      driverAssignedAt: ride.driverAssignedAt,
      driverDetails: ride.driverDetails,
      estimatedArrivalTime: ride.estimatedArrivalTime,
    });

    // Store event in history
    await storeEventInHistory(
      igoConfig.eventTypes.DRIVER_ASSIGNED,
      eventData,
      ride
    );

    return {
      status: "processed",
      message: "Driver assigned",
      rideId: ride._id,
    };
  } catch (error) {
    console.error("Error handling driver assignment:", error);
    return { status: "error", message: error.message };
  }
};

const handleDriverArrived = async (ride, eventData) => {
  try {
    console.log(
      "in the specified event handler" + " which is handleDriverArrived"
    );
    // Update ride with arrival information
    ride.status = igoConfig.rideStatuses.DRIVER_ARRIVED;
    ride.driverArrivedAt = new Date();

    await ride.save();

    // Send notification to user about driver arrival
    await sendRideStatusNotification(ride, "booking.driver_arrived", eventData);

    // Emit socket event
    emitRideUpdate(ride._id, {
      status: ride.status,
      driverArrivedAt: ride.driverArrivedAt,
    });

    // Store event in history
    await storeEventInHistory(
      igoConfig.eventTypes.DRIVER_ARRIVED,
      eventData,
      ride
    );

    return {
      status: "processed",
      message: "Driver arrived",
      rideId: ride._id,
    };
  } catch (error) {
    console.error("Error handling driver arrival:", error);
    return { status: "error", message: error.message };
  }
};

const handleJourneyStarted = async (ride, eventData) => {
  try {
    console.log(
      "in the specified event handler" + " which is handleJourneyStarted"
    );
    // Update ride with journey start information
    ride.status = igoConfig.rideStatuses.IN_PROGRESS;
    ride.journeyStartedAt = new Date();

    // Update driver location if provided
    if (eventData.Location) {
      ride.currentLocation = eventData.Location;
    }

    await ride.save();

    // Send notification
    await sendRideStatusNotification(
      ride,
      "booking.journey_started",
      eventData
    );

    // Emit socket events
    emitRideUpdate(ride._id, {
      status: ride.status,
      journeyStartedAt: ride.journeyStartedAt,
    });

    if (eventData.Location) {
      emitDriverLocation(ride._id, eventData.Location);
    }

    // Store event in history
    await storeEventInHistory(
      igoConfig.eventTypes.JOURNEY_STARTED,
      eventData,
      ride
    );

    return {
      status: "processed",
      message: "Journey started",
      rideId: ride._id,
    };
  } catch (error) {
    console.error("Error handling journey start:", error);
    return { status: "error", message: error.message };
  }
};

const handleJourneyCompleted = async (ride, eventData) => {
  try {
    console.log(
      "in the specified event handler" + " which is handleJourneyCompleted"
    );
    // Update ride with journey completion information
    ride.status = igoConfig.rideStatuses.JOURNEY_COMPLETED;
    ride.journeyCompletedAt = new Date();

    // Update final fare if available
    if (eventData.FinalFare) {
      const originalFare = parseFloat(eventData.FinalFare);
      const markedUpFare = parseFloat((originalFare * 1.25).toFixed(2));

      ride.originalFare = originalFare;
      ride.finalFare = markedUpFare;
      ride.platformMarkup = "25%";
    }

    await ride.save();

    // Send notification to user about journey completion
    await sendRideStatusNotification(
      ride,
      "booking.journey_completed",
      eventData
    );

    // Emit socket events
    emitRideUpdate(ride._id, {
      status: ride.status,
      journeyCompletedAt: ride.journeyCompletedAt,
      finalFare: ride.finalFare,
      originalFare: ride.originalFare,
    });

    // If payment is required at end of journey, emit payment update
    if (ride.paymentPoint === "END_OF_JOURNEY") {
      emitPaymentUpdate(ride._id, {
        required: true,
        amount: ride.finalFare,
        currency: ride.currency || "GBP",
      });
    }

    // Store event in history
    await storeEventInHistory(
      igoConfig.eventTypes.JOURNEY_COMPLETED,
      eventData,
      ride
    );

    return {
      status: "processed",
      message: "Journey completed",
      rideId: ride._id,
    };
  } catch (error) {
    console.error("Error handling journey completion:", error);
    return { status: "error", message: error.message };
  }
};

/**
 * Request bids from all available vendors (AgentBidRequest)
 */
export const requestBids = async (
  pickupLocation,
  dropoffLocation,
  pickupTime,
  vehicleType = igoConfig.vehicleTypes.STANDARD,
  passengers = []
) => {
  try {
    const passengerDetails =
      passengers.length > 0
        ? passengers
        : [
            {
              name: "Default Passenger",
              phone: "",
              email: "",
              isLead: true,
            },
          ];

    // Format pickup time
    const bookingTime = new Date(pickupTime).toISOString();

    // Map vehicle type to appropriate category and type enums
    let vehicleCategory = igoConfig.vehicleCategories.STANDARD;
    let vehicleTypeEnum = igoConfig.vehicleTypeEnums.SALOON;

    // Map the vehicle type to the appropriate category and type
    if (vehicleType === igoConfig.vehicleTypes.EXECUTIVE) {
      vehicleCategory = igoConfig.vehicleCategories.EXECUTIVE;
    } else if (vehicleType === igoConfig.vehicleTypes.LUXURY) {
      vehicleCategory = igoConfig.vehicleCategories.LUXURY;
    } else if (vehicleType === igoConfig.vehicleTypes.MINIBUS) {
      vehicleTypeEnum = igoConfig.vehicleTypeEnums.MINIBUS;
    }

    const xmlRequest = {
      AgentBidRequest: {
        Agent: igoConfig.buildAgentSection(),
        Vendor: igoConfig.buildVendorSection(),
        BidParameters: {
          Source: "Other",
          BookingTimeMode: "Fixed",
          BookingTime: bookingTime,
          Availability: "Any",
          ...igoConfig.buildPassengerSection(passengerDetails),

          Pricing: {
            Currency: "GBP",
            PaymentType: "Account",
            PaymentPoint: igoConfig.paymentPoints.TIME_OF_BOOKING,
            MarketPlace: "IGO",
          },

          Journey: igoConfig.buildJourneySection({
            pickup: pickupLocation,
            dropoff: dropoffLocation,
            time: pickupTime,
          }),

          Ride: {
            Type: "Passenger",
            Count: (passengers.length || 1).toString(),
            VehicleType: vehicleTypeEnum,
            VehicleCategory: vehicleCategory,
          },
        },
      },
    };

    const xmlString = igoConfig.buildXmlRequest(xmlRequest);

    console.log("the xml string is", xmlString);

    const response = await sendIgoRequest(xmlString);
    console.log("the response is", JSON.stringify(response));
    return response;
  } catch (error) {
    console.error("Bid request error:", error);
    throw error;
  }
};

/**
 * Process payment for a completed ride
 * @param {string} authorizationReference - The authorization reference from the booking
 * @param {number} paymentAmount - The amount to charge
 * @param {string} paymentMethod - The payment method (CARD, CASH, etc.)
 * @param {string} transactionReference - A unique reference for this transaction
 * @param {object} cardDetails - Optional card details for card payments
 * @returns {Promise<object>} - The payment response
 */
export const processPayment = async (
  authorizationReference,
  paymentAmount,
  paymentMethod,
  transactionReference,
  cardDetails = null
) => {
  try {
    console.log(`Processing payment for booking ${authorizationReference}`);

    const request = igoConfig.buildXmlRequest({
      AgentPaymentRequest: {
        Agent: igoConfig.buildAgentSection(),
        Vendor: igoConfig.buildVendorSection(),
        AuthorizationReference: authorizationReference,
        Amount: paymentAmount,
        PaymentMethod: paymentMethod,
        TransactionReference: transactionReference,
        CardDetails: cardDetails
          ? {
              CardType: cardDetails.cardType,
              CardNumber: cardDetails.cardNumber,
              ExpiryMonth: cardDetails.expiryMonth,
              ExpiryYear: cardDetails.expiryYear,
              Cvv: cardDetails.cvv,
            }
          : undefined,
      },
    });

    const response = await sendIgoRequest(request);
    return response.AgentPaymentResponse;
  } catch (error) {
    console.error("Error processing payment:", error);
    throw error;
  }
};

/**
 * Request a bill for a completed ride
 * @param {string} authorizationReference - The authorization reference from the booking
 * @returns {Promise<object>} - The bill response
 */
export const requestBill = async (authorizationReference) => {
  try {
    console.log(`Requesting bill for booking ${authorizationReference}`);

    const request = igoConfig.buildXmlRequest({
      AgentBillRequest: {
        Agent: igoConfig.buildAgentSection(),
        Vendor: igoConfig.buildVendorSection(),
        AuthorizationReference: authorizationReference,
      },
    });

    const response = await sendIgoRequest(request);
    return response.AgentBillResponse;
  } catch (error) {
    console.error("Error requesting bill:", error);
    throw error;
  }
};

/**
 * Get a receipt for a completed ride with payment
 * @param {string} authorizationReference - The authorization reference from the booking
 * @returns {Promise<object>} - The receipt response
 */
export const getReceipt = async (authorizationReference) => {
  try {
    console.log(`Getting receipt for booking ${authorizationReference}`);

    const request = igoConfig.buildXmlRequest({
      AgentReceiptRequest: {
        Agent: igoConfig.buildAgentSection(),
        Vendor: igoConfig.buildVendorSection(),
        AuthorizationReference: authorizationReference,
      },
    });

    const response = await sendIgoRequest(request);
    return response.AgentReceiptResponse;
  } catch (error) {
    console.error("Error getting receipt:", error);
    throw error;
  }
};

/**
 * Store event in history
 * @param {string} eventType - The type of event
 * @param {object} eventData - The data associated with the event
 * @param {object} ride - The ride associated with the event
 * @returns {Promise<void>}
 */
const storeEventInHistory = async (eventType, eventData, ride) => {
  try {
    // Create a new event history record
    await EventHistory.create({
      eventType,
      eventData,
      timestamp: new Date(),
      authorizationReference:
        eventData.AuthorizationReference || ride?.igoAuthorizationReference,
      bookingReference: eventData.BookingReference || ride?.bookingReference,
      rideId: ride?._id?.toString(), // Add the ride ID to match with on client side
    });
  } catch (error) {
    console.error("Error storing event in history:", error);
  }
};
