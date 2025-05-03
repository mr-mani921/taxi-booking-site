import { parseStringPromise, Builder } from "xml2js";
import Ride from "../models/Ride.js";
import igoConfig from "../config/igoConfig.js";
import {
  emitRideUpdate,
  emitDriverLocation,
} from "../services/socketService.js";
import EventHistory from "../models/EventHistory.js";
import { handleIgoEvent as processIgoEvent } from "../services/igoService.js";

/**
 * Main handler for iGo events
 * Processes incoming XML events from iGo and returns appropriate XML responses
 */
export const handleIgoEvent = async (req, res) => {
  try {
    const { eventName } = req.params;
    const authRef = req.headers["x-authorization-reference"];
    const bookingRef = req.headers["x-agent-booking-reference"];

    // console.log("the event body is ", req.body);

    // Log incoming event
    console.log(`Received iGo event: ${eventName}`, {
      headers: req.headers,
      body: req.body,
      eventName,
      authRef,
      bookingRef,
      timestamp: new Date().toISOString(),
    });

    // Parse XML body if it's not already parsed
    let eventData = req.body;
    if (typeof eventData === "string") {
      try {
        const parsedData = await parseStringPromise(eventData, {
          explicitArray: false,
          ignoreAttrs: false,
          trim: true,
        });
        eventData = parsedData;
      } catch (parseError) {
        console.error("Error parsing XML:", parseError);
        return res
          .status(400)
          .send(buildErrorResponse(eventName, "Invalid XML format"));
      }
    }

    // Store event in history
    await storeEventHistory(eventName, authRef, bookingRef, eventData);

    // Process the event
    const result = await processIgoEvent(eventName, eventData);

    // Build XML response based on event type
    const xmlResponse = buildEventResponse(eventName, result);

    // Send response
    res.header("Content-Type", "text/xml");
    return res.send(xmlResponse);
  } catch (error) {
    console.error(`Error handling iGo event:`, error);
    return res
      .status(500)
      .send(buildErrorResponse(req.params.eventName, error.message));
  }
};

/**
 * Simulate iGo events for testing
 * Allows frontend to trigger test events
 */
export const simulateIgoEvent = async (req, res) => {
  try {
    const { eventType } = req.params;
    const { bookingReference, authorizationReference, eventData } = req.body;

    if (!bookingReference || !authorizationReference) {
      return res.status(400).json({
        success: false,
        message: "bookingReference and authorizationReference are required",
      });
    }

    // Find the ride
    const ride = await Ride.findOne({
      $or: [
        { bookingReference },
        { igoAuthorizationReference: authorizationReference },
      ],
    });

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: "Ride not found",
      });
    }

    // Build mock event data
    const mockEvent = buildMockEvent(eventType, ride, eventData);

    // Process the event
    const result = await processIgoEvent(eventType, mockEvent);

    return res.json({
      success: true,
      message: `Simulated ${eventType} event`,
      result,
    });
  } catch (error) {
    console.error(`Error simulating iGo event:`, error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get event history for a booking
 */
export const getEventHistory = async (req, res) => {
  try {
    const { bookingReference } = req.params;

    const events = await EventHistory.find({
      $or: [{ bookingReference }, { authorizationReference: bookingReference }],
    }).sort({ timestamp: 1 });

    return res.json({
      success: true,
      count: events.length,
      events,
    });
  } catch (error) {
    console.error(`Error getting event history:`, error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Store event in history
 */
const storeEventHistory = async (eventType, authRef, bookingRef, eventData) => {
  try {
    // Create event history record
    const event = new EventHistory({
      eventType,
      authorizationReference: authRef,
      bookingReference: bookingRef,
      eventData,
      timestamp: new Date(),
    });

    await event.save();
    return event;
  } catch (error) {
    console.error(`Error storing event history:`, error);
    // Don't throw error, just log it
    return null;
  }
};

/**
 * Build XML response for event
 */
const buildEventResponse = (eventType, result) => {
  // The response type is always the event name with "Request" replaced by "Response"
  const responseType = eventType.replace("Request", "Response");

  // Create XML builder
  const builder = new Builder({
    headless: true,
    renderOpts: { pretty: true, indent: "  ", newline: "\n" },
    xmldec: { version: "1.0", encoding: "UTF-8" },
  });

  // Build response object
  const responseObj = {
    [responseType]: {
      Result: {
        Success: result.status === "error" ? "false" : "true",
        ...(result.status === "error" && {
          FailureReason: result.message,
          FailureCode: "EVENT_PROCESSING_ERROR",
        }),
      },
    },
  };

  return builder.buildObject(responseObj);
};

/**
 * Build error response
 */
const buildErrorResponse = (eventType, errorMessage) => {
  const responseType = eventType.replace("Request", "Response");

  const builder = new Builder({
    headless: true,
    renderOpts: { pretty: true, indent: "  ", newline: "\n" },
    xmldec: { version: "1.0", encoding: "UTF-8" },
  });

  const responseObj = {
    [responseType]: {
      Result: {
        Success: "false",
        FailureReason: errorMessage,
        FailureCode: "EVENT_PROCESSING_ERROR",
      },
    },
  };

  return builder.buildObject(responseObj);
};

/**
 * Build mock event data for simulation
 */
const buildMockEvent = (eventType, ride, additionalData = {}) => {
  const baseEvent = {
    AuthorizationReference: ride.igoAuthorizationReference,
    BookingReference: ride.bookingReference,
    VendorId: igoConfig.vendorId,
    Time: new Date().toISOString(),
  };

  switch (eventType) {
    case igoConfig.eventTypes.DISPATCHED:
      return {
        ...baseEvent,
        Driver: {
          Name: additionalData.driverName || "Test Driver",
          TelephoneNumber: additionalData.driverPhone || "+1234567890",
          VehicleDetails: {
            Make: additionalData.vehicleMake || "Toyota",
            Model: additionalData.vehicleModel || "Camry",
            Color: additionalData.vehicleColor || "Black",
            RegistrationNumber: additionalData.vehicleReg || "TEST123",
          },
        },
        ...additionalData,
      };

    case igoConfig.eventTypes.DRIVER_ASSIGNED:
      return {
        ...baseEvent,
        Driver: {
          Name: additionalData.driverName || "Test Driver",
          TelephoneNumber: additionalData.driverPhone || "+1234567890",
          LicenseNumber: additionalData.licenseNumber || "DL12345",
          Rating: additionalData.rating || "4.8",
          VehicleDetails: {
            Make: additionalData.vehicleMake || "Toyota",
            Model: additionalData.vehicleModel || "Camry",
            Color: additionalData.vehicleColor || "Black",
            RegistrationNumber: additionalData.vehicleReg || "TEST123",
          },
        },
        EstimatedArrivalTime:
          additionalData.eta || new Date(Date.now() + 10 * 60000).toISOString(),
        ...additionalData,
      };

    case igoConfig.eventTypes.DRIVER_ARRIVED:
      return {
        ...baseEvent,
        ...additionalData,
      };

    case igoConfig.eventTypes.JOURNEY_STARTED:
      return {
        ...baseEvent,
        ...additionalData,
      };

    case igoConfig.eventTypes.JOURNEY_COMPLETED:
    case igoConfig.eventTypes.COMPLETED:
      return {
        ...baseEvent,
        FinalFare: additionalData.finalFare || ride.fare || "45.00",
        ...additionalData,
      };

    case igoConfig.eventTypes.CANCELLED:
      return {
        ...baseEvent,
        Reason: additionalData.reason || "Cancelled by testing",
        ...additionalData,
      };

    case igoConfig.eventTypes.FAILED:
      return {
        ...baseEvent,
        Reason: additionalData.reason || "Failed by testing",
        ...additionalData,
      };

    default:
      return {
        ...baseEvent,
        ...additionalData,
      };
  }
};
