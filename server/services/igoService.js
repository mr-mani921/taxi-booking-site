import axios from "axios";
import { parseStringPromise, Builder } from "xml2js";
import Ride from "../models/Ride.js";
import igoConfig from "../config/igoConfig.js";
import { sendRideStatusNotification } from "./notificationService.js";

// Mock mode for testing without the real iGo API
const MOCK_MODE = process.env.MOCK_MODE === "true" || true; // Set to true for testing

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
      ignoreAttrs: true, // Ignore XML attributes
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
function getMockResponse(xmlBody) {
  const mockAvailabilityRef = "MOCK_AVAIL_" + Date.now();
  const mockAuthRef = "MOCK_AUTH_" + Date.now();

  // Extract any existing availability reference from the request
  let availabilityRef = extractAvailabilityRef(xmlBody);

  if (xmlBody.includes("AgentPriceEstimateRequest")) {
    return {
      AgentPriceEstimateResponse: {
        Price: 25.5,
        Currency: "USD",
        EstimatedTime: 15,
      },
    };
  } else if (xmlBody.includes("AgentBookingAvailabilityRequest")) {
    return {
      AgentBookingAvailabilityResponse: {
        AvailabilityReference: mockAvailabilityRef,
        Available: true,
        EstimatedTime: 10,
        // Include this so the client can store it for subsequent requests
        savedAvailabilityReference: mockAvailabilityRef,
      },
    };
  } else if (xmlBody.includes("AgentBookingAuthorizationRequest")) {
    return {
      AgentBookingAuthorizationResponse: {
        AuthorizationReference: mockAuthRef,
        Status: "Booked",
        EstimatedTime: 10,
        AvailabilityReference: availabilityRef || "DefaultAvailRef",
      },
    };
  } else if (xmlBody.includes("AgentBookingStatusRequest")) {
    return {
      AgentBookingStatusResponse: {
        Status: "Dispatched",
        BookingTime: new Date().toISOString(),
        EstimatedArrivalTime: new Date(Date.now() + 10 * 60000).toISOString(),
      },
    };
  } else if (xmlBody.includes("AgentBookingCancellationRequest")) {
    return {
      AgentBookingCancellationResponse: {
        Status: "Cancelled",
        CancellationTime: new Date().toISOString(),
      },
    };
  } else if (xmlBody.includes("AgentBidRequest")) {
    return {
      AgentBidResponse: {
        Status: "OK",
        BidReference: `BID_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        Bids: {
          Bid: [
            {
              VendorId: "VENDOR_1",
              VendorName: "Premium Taxis",
              PriceBand: {
                Currency: "GBP",
                MinimumPrice: "18.00",
                MaximumPrice: "28.00",
                EstimatedPrice: "23.00",
              },
              ETAInMinutes: "8",
              VehicleType: igoConfig.vehicleTypes.EXECUTIVE,
            },
            {
              VendorId: "VENDOR_2",
              VendorName: "Budget Cabs",
              PriceBand: {
                Currency: "GBP",
                MinimumPrice: "12.00",
                MaximumPrice: "20.00",
                EstimatedPrice: "16.00",
              },
              ETAInMinutes: "15",
              VehicleType: igoConfig.vehicleTypes.STANDARD,
            },
          ],
        },
      },
    };
  } else if (xmlBody.includes("AgentPaymentRequest")) {
    return {
      AgentPaymentResponse: {
        Status: "Accepted",
        AuthorizationReference: extractAuthRef(xmlBody) || "MOCK_AUTH_REF",
        PaymentReference: `PAY_${Date.now()}`,
        TransactionTime: new Date().toISOString(),
        ReceiptAvailable: true,
      },
    };
  } else if (xmlBody.includes("AgentBillRequest")) {
    return {
      AgentBillResponse: {
        Status: "OK",
        AuthorizationReference: extractAuthRef(xmlBody) || "MOCK_AUTH_REF",
        BillItems: {
          BillItem: [
            {
              Description: "Base fare",
              Amount: "15.50",
              Type: "Fare",
            },
            {
              Description: "Waiting time",
              Amount: "2.50",
              Type: "Extra",
            },
            {
              Description: "Airport fee",
              Amount: "3.00",
              Type: "Fee",
            },
          ],
        },
        SubTotal: "21.00",
        Tax: "4.20",
        Total: "25.20",
        Currency: "GBP",
        PaymentStatus: "Pending",
      },
    };
  } else if (xmlBody.includes("AgentReceiptRequest")) {
    return {
      AgentReceiptResponse: {
        Status: "OK",
        AuthorizationReference: extractAuthRef(xmlBody) || "MOCK_AUTH_REF",
        VendorName: "Test Taxi Company",
        ReceiptNumber: `RCPT-${Date.now()}`,
        BookingReference: `BOOKING_${Date.now()}`,
        PaymentReference: `PAY_${Date.now() - 1000}`,
        JourneyDetails: {
          StartTime: new Date(Date.now() - 3600000).toISOString(),
          EndTime: new Date(Date.now() - 600000).toISOString(),
          PickupAddress: "123 Pickup Street, London",
          DropoffAddress: "456 Dropoff Avenue, London",
          Distance: "5.2 miles",
        },
        BillItems: {
          BillItem: [
            {
              Description: "Base fare",
              Amount: "15.50",
              Type: "Fare",
            },
            {
              Description: "Waiting time",
              Amount: "2.50",
              Type: "Extra",
            },
            {
              Description: "Airport fee",
              Amount: "3.00",
              Type: "Fee",
            },
          ],
        },
        SubTotal: "21.00",
        Tax: "4.20",
        Total: "25.20",
        Currency: "GBP",
        PaymentMethod: "Card",
        PaymentTime: new Date(Date.now() - 500000).toISOString(),
        ReceiptURL: "https://mock-taxi-company.com/receipts/RCPT-12345.pdf",
      },
    };
  }

  return { MockResponse: "Unknown request type" };
}

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
    // Log the event for debugging
    console.log(`Received iGo event: ${eventType}`, eventData);

    // Parse booking reference from the event data
    let bookingId;

    // Extract the booking reference based on event type
    if (eventType === igoConfig.eventTypes.DISPATCHED) {
      bookingId = eventData.AuthorizationReference;
    } else if (eventType === igoConfig.eventTypes.COMPLETED) {
      bookingId = eventData.AuthorizationReference;
    } else if (eventType === igoConfig.eventTypes.CANCELLED) {
      bookingId = eventData.AuthorizationReference;
    } else if (eventType === igoConfig.eventTypes.FAILED) {
      bookingId = eventData.AuthorizationReference;
    } else if (eventType === igoConfig.eventTypes.DRIVER_ASSIGNED) {
      bookingId = eventData.AuthorizationReference;
    } else if (eventType === igoConfig.eventTypes.DRIVER_ARRIVED) {
      bookingId = eventData.AuthorizationReference;
    } else if (eventType === igoConfig.eventTypes.JOURNEY_STARTED) {
      bookingId = eventData.AuthorizationReference;
    } else if (eventType === igoConfig.eventTypes.JOURNEY_COMPLETED) {
      bookingId = eventData.AuthorizationReference;
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
 * Get estimated price for a journey
 */
export const getEstimatedPrice = async (
  pickup,
  dropoff,
  time,
  vehicleType = igoConfig.vehicleTypes.STANDARD
) => {
  try {
    const xmlRequest = igoConfig.buildXmlRequest({
      AgentPriceEstimateRequest: {
        Agent: igoConfig.buildAgentSection(),
        Vendor: igoConfig.buildVendorSection(),
        Journey: igoConfig.buildJourneySection({ pickup, dropoff, time }),
        VehicleType: vehicleType,
      },
    });

    const response = await sendIgoRequest(xmlRequest);
    return response;
  } catch (error) {
    console.error("Price estimation error:", error);
    throw error;
  }
};

/**
 * Check ride availability
 */
export const checkAvailability = async (
  pickup,
  dropoff,
  time,
  vehicleType = igoConfig.vehicleTypes.STANDARD,
  pricingModel = igoConfig.pricingModels.UP_FRONT,
  paymentPoint = igoConfig.paymentPoints.TIME_OF_BOOKING
) => {
  try {
    const xmlRequest = igoConfig.buildXmlRequest({
      AgentBookingAvailabilityRequest: {
        Agent: igoConfig.buildAgentSection(),
        Vendor: igoConfig.buildVendorSection(),
        Journey: igoConfig.buildJourneySection({ pickup, dropoff, time }),
        VehicleType: vehicleType,
        Pricing: igoConfig.buildPricingSection({
          pricingModel,
          paymentPoint,
          price: 0, // Price will be set during booking
        }),
      },
    });

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
export const bookRide = async ({
  pickup,
  dropoff,
  time,
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
    const xmlRequest = igoConfig.buildXmlRequest({
      AgentBookingAuthorizationRequest: {
        Agent: igoConfig.buildAgentSection(),
        Vendor: igoConfig.buildVendorSection(),
        AvailabilityReference:
          availabilityReference || "AvailabilityRef_" + Date.now(),
        AgentBookingReference:
          agentBookingReference || igoConfig.generateBookingReference(),
        Journey: igoConfig.buildJourneySection({ pickup, dropoff, time }),
        VehicleType: vehicleType,
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
        Passengers: igoConfig.buildPassengerSection(passengers),
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
    // Update ride with dispatch information
    ride.status = igoConfig.rideStatuses.DISPATCHED;
    ride.dispatchedAt = new Date();

    // Extract driver and vehicle information if available
    if (eventData.Driver) {
      ride.driverDetails = {
        name: eventData.Driver.Name,
        phone: eventData.Driver.TelephoneNumber,
        vehicleDetails: eventData.Driver.VehicleDetails,
      };
    }

    await ride.save();

    // Send notification to user about dispatch
    await sendRideStatusNotification(ride, "booking.dispatched", eventData);

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
    // Update ride with cancellation information
    ride.status = igoConfig.rideStatuses.CANCELLED;
    ride.cancelledAt = new Date();
    ride.cancellationReason = eventData.Reason || "Cancelled via iGo";

    await ride.save();

    // Send notification to user about cancellation
    await sendRideStatusNotification(ride, "booking.cancelled", eventData);

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
    // Update ride with failure information
    ride.status = igoConfig.rideStatuses.FAILED;
    ride.failedAt = new Date();
    ride.failureReason = eventData.Reason || "Failed via iGo";

    await ride.save();

    // Send notification to user about failure
    await sendRideStatusNotification(ride, "booking.failed", eventData);

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
    // Update ride with driver information
    ride.status = igoConfig.rideStatuses.DRIVER_ASSIGNED;
    ride.driverAssignedAt = new Date();

    // Extract driver information
    if (eventData.Driver) {
      ride.driverDetails = {
        name: eventData.Driver.Name,
        phone: eventData.Driver.TelephoneNumber,
        vehicleDetails: eventData.Driver.VehicleDetails,
        licensePlate: eventData.Driver.LicensePlate,
      };
    }

    await ride.save();

    // Send notification to user about driver assignment
    await sendRideStatusNotification(
      ride,
      "booking.driver_assigned",
      eventData
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
    // Update ride with arrival information
    ride.status = igoConfig.rideStatuses.DRIVER_ARRIVED;
    ride.driverArrivedAt = new Date();

    await ride.save();

    // Send notification to user about driver arrival
    await sendRideStatusNotification(ride, "booking.driver_arrived", eventData);

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
    // Update ride with journey start information
    ride.status = igoConfig.rideStatuses.JOURNEY_STARTED;
    ride.journeyStartedAt = new Date();

    await ride.save();

    // Send notification to user about journey start
    await sendRideStatusNotification(
      ride,
      "booking.journey_started",
      eventData
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
  pickup,
  dropoff,
  time,
  vehicleType = igoConfig.vehicleTypes.STANDARD
) => {
  try {
    const xmlRequest = igoConfig.buildXmlRequest({
      AgentBidRequest: {
        Agent: igoConfig.buildAgentSection(),
        Journey: igoConfig.buildJourneySection({ pickup, dropoff, time }),
        VehicleType: vehicleType,
        Notifications: {
          SMS: true,
          Email: true,
        },
      },
    });

    const response = await sendIgoRequest(xmlRequest);
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
