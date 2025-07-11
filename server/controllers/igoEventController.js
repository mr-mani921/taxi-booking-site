const { parseStringPromise, Builder } = require("xml2js");
const Ride = require("../models/Ride.js");
const igoConfig = require("../config/igoConfig.js");
const {
  emitRideUpdate,
  emitDriverLocation,
} = require("../services/socketService.js");
const EventHistory = require("../models/EventHistory.js");
const {
  handleIgoEvent: processIgoEvent,
} = require("../services/igoService.js");

/**
 * Main handler for iGo events
 * Processes incoming XML events from iGo and returns appropriate XML responses
 */
const handleIgoEvent = async (req, res) => {
  try {
    const { eventName } = req.params;
    let authRef = req.headers["x-authorization-reference"];
    let bookingRef = req.headers["x-agent-booking-reference"];


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

    // Extract booking reference from the event data - handle all event types
    try {
      // The root element usually matches the event name
      const rootElement = eventData[eventName];
      if (rootElement && rootElement.BookingReference) {
        bookingRef = rootElement.BookingReference;
        authRef = rootElement.AuthorizationReference;
        console.log(
          `Extracted booking reference: ${bookingRef} from ${eventName}`
        );
      } else {
        console.log(
          `Could not extract booking reference from event data:`,
          eventData
        );
      }
    } catch (error) {
      console.error(`Error extracting booking reference:`, error);
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
const simulateIgoEvent = async (req, res) => {
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
const getEventHistory = async (req, res) => {
  try {
    const { bookingReference } = req.params;


    // Look for events using both the booking reference and as a potential ride ID
    const events = await EventHistory.find({
      $or: [
        { bookingReference },
        { authorizationReference: bookingReference },
        { rideId: bookingReference },
      ],
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

    // Don't proceed if we don't have any reference at all
    if (!bookingRef && !authRef) {
      console.warn(
        "Cannot store event history: missing both bookingReference and authorizationReference"
      );
      return null;
    }

    // Create event history record
    const event = new EventHistory({
      eventType,
      authorizationReference: authRef,
      bookingReference: bookingRef,
      eventData,
      timestamp: new Date(),
    });

    const savedEvent = await event.save();
    return savedEvent;
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
        FailureCode: "SYSTEM_ERROR",
      },
    },
  };

  return builder.buildObject(responseObj);
};

/**
 * Build mock event data for testing
 */
const buildMockEvent = (eventType, ride, additionalData = {}) => {
  const mockEvent = {};
  const eventRequestType = eventType + "Request";

  mockEvent[eventRequestType] = {
    Agent: {
      Id: igoConfig.agentId,
      Password: igoConfig.agentPassword,
      Reference: `AgentRef_${Date.now()}`,
      Time: new Date().toISOString(),
    },
    Vendor: {
      Id: igoConfig.vendorId,
    },
    BookingReference: ride.bookingReference || `MOCK_BOOKING_${Date.now()}`,
    AuthorizationReference:
      ride.igoAuthorizationReference || `MOCK_AUTH_${Date.now()}`,
    ...additionalData,
  };

  return mockEvent;
};

module.exports = {
  handleIgoEvent,
  simulateIgoEvent,
  getEventHistory,
};
