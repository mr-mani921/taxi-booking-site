import axios from "axios";
import { parseStringPromise, Builder } from "xml2js";
import Ride from "../models/Ride.js";
import igoConfig from "../config/igoConfig.js";

// Mock mode for testing without the real iGo API
const MOCK_MODE = process.env.MOCK_MODE === "true" || true; // Set to true for testing

// Pricing models and payment points
export const PRICING_MODELS = igoConfig.pricingModels;
export const PAYMENT_POINTS = igoConfig.paymentPoints;
export const PRICING_FLAGS = igoConfig.pricingFlags;

/**
 * Send a request to the iGo API with XML payload.
 */
export const sendIgoRequest = async (xmlBody) => {
  try {
    // Log outgoing requests in development
    if (!igoConfig.isProduction) {
      console.log("iGo API Request:", xmlBody);
    }

    // Use mock response in mock mode
    if (MOCK_MODE) {
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
    // In mock mode, don't throw errors
    if (MOCK_MODE) {
      console.log("MOCK MODE: Ignoring error and returning mock response");
      return getMockResponse(xmlBody);
    }

    // Handle different types of errors
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error("iGo API Error Response:", {
        status: error.response.status,
        data: error.response.data,
      });
      throw new Error(
        `iGo API Error (${error.response.status}): ${
          error.response.data || error.message
        }`
      );
    } else if (error.request) {
      // The request was made but no response was received
      console.error("iGo API No Response:", error.request);
      throw new Error(`iGo API Timeout or Network Error: No response received`);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error("iGo API Error:", error.message);
      throw error;
    }
  }
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

    // TODO: Send notification to user about dispatch

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

    // TODO: Send notification to user about completion

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
    ride.cancellationReason =
      eventData.CancellationReason || "Cancelled by dispatch system";

    await ride.save();

    // TODO: Send notification to user about cancellation

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
  // Additional processing for failure event
  return { status: "success", message: "Booking failed" };
};

const handleDriverAssigned = async (ride, eventData) => {
  // Additional processing for driver assignment event
  return { status: "success", message: "Driver assigned" };
};

const handleDriverArrived = async (ride, eventData) => {
  // Additional processing for driver arrival event
  return { status: "success", message: "Driver arrived" };
};

const handleJourneyStarted = async (ride, eventData) => {
  // Additional processing for journey start event
  return { status: "success", message: "Journey started" };
};

const handleJourneyCompleted = async (ride, eventData) => {
  // Additional processing for journey completion event
  return { status: "success", message: "Journey completed" };
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
