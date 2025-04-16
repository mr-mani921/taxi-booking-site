/**
 * iGo API Configuration
 * This file contains all configuration settings for the iGo integration
 */

import dotenv from "dotenv";
import { Builder } from "xml2js";

dotenv.config();
console.log("IGO_AGENT_ID:", process.env.IGO_AGENT_ID);

// Default values for testing environment
const defaults = {
  // API URLs
  API_URL: "https://cxs-staging.autocab.net/api/agent",
  EVENT_BASE_URL: process.env.IGO_EVENT_BASE_URL,

  // Credentials
  AGENT_ID: process.env.IGO_AGENT_ID,
  AGENT_PASSWORD: process.env.IGO_AGENT_PASSWORD,
  VENDOR_ID: process.env.IGO_VENDOR_ID,

  // Request configuration
  API_TIMEOUT: 30000, // 30 seconds

  // Event handling
  EVENT_WEBHOOK_PATH: "/api/rides/webhook/igo",
};

// Configuration object
const igoConfig = {
  // API URLs
  apiUrl: process.env.IGO_API_URL || defaults.API_URL,
  eventBaseUrl: process.env.IGO_EVENT_BASE_URL || defaults.EVENT_BASE_URL,

  // Credentials
  agentId: process.env.IGO_AGENT_ID || defaults.AGENT_ID,
  agentPassword: process.env.IGO_AGENT_PASSWORD || defaults.AGENT_PASSWORD,
  vendorId: process.env.IGO_VENDOR_ID || defaults.VENDOR_ID,

  // Request configuration
  apiTimeout: parseInt(process.env.IGO_API_TIMEOUT || defaults.API_TIMEOUT),

  // Pricing models (as per iGo Protocol V1.41)
  pricingModels: {
    UP_FRONT: "UpFront",
    ESTIMATED: "Estimated",
    AGENT_SET: "AgentSet",
  },

  // Payment points (as per iGo Protocol V1.41)
  paymentPoints: {
    TIME_OF_BOOKING: "TimeOfBooking",
    END_OF_JOURNEY: "EndOfJourney",
    AWAIT_FINAL_PRICE: "AwaitFinalPrice",
  },

  // Pricing flags (as per iGo Protocol V1.41)
  pricingFlags: {
    ALLOW_WAITING_TIME: "AllowWaitingTime",
    ALLOW_EXTRAS: "AllowExtras",
    ALLOW_TOLLS: "AllowTolls",
    ALLOW_PARKING: "AllowParking",
  },

  // Vehicle types (as per iGo Protocol V1.41)
  vehicleTypes: {
    STANDARD: "Standard",
    EXECUTIVE: "Executive",
    LUXURY: "Luxury",
    WHEELCHAIR: "Wheelchair",
    MINIBUS: "Minibus",
  },

  // Vehicle categories (as per iGo Protocol V1.41)
  vehicleCategories: {
    STANDARD: "Standard",
    EXECUTIVE: "Executive",
    LUXURY: "Luxury",
    HACKNEY: "Hackney",
  },

  // Vehicle types (as per iGo Protocol V1.41)
  vehicleTypeEnums: {
    SALOON: "Saloon",
    ESTATE: "Estate",
    MPV: "MPV",
    COACH: "Coach",
    MINIBUS: "MiniBus",
    SUV: "SUV",
  },

  // Ride statuses (as per iGo Protocol V1.41)
  rideStatuses: {
    PENDING: "Pending",
    BOOKED: "Booked",
    DISPATCHED: "Dispatched",
    IN_PROGRESS: "InProgress",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
    FAILED: "Failed",
  },

  // Event types (as per iGo Protocol V1.41)
  eventTypes: {
    DISPATCHED: "AgentBookingDispatchedEventRequest",
    COMPLETED: "AgentBookingCompletedEventRequest",
    CANCELLED: "AgentBookingCancelledEventRequest",
    FAILED: "AgentBookingFailedEventRequest",
    DRIVER_ASSIGNED: "AgentBookingDriverAssignedEventRequest",
    DRIVER_ARRIVED: "AgentBookingDriverArrivedEventRequest",
    JOURNEY_STARTED: "AgentBookingJourneyStartedEventRequest",
    JOURNEY_COMPLETED: "AgentBookingJourneyCompletedEventRequest",
  },

  // Validation
  isProduction: process.env.NODE_ENV === "production",

  // Helper methods
  generateBookingReference: () =>
    `BOOKING_${Date.now()}_${Math.floor(Math.random() * 1000)}`,

  // Get the full webhook URL
  getWebhookUrl: () => {
    const baseUrl = process.env.API_BASE_URL || "https://your-api-domain.com";
    return `${baseUrl}${defaults.EVENT_WEBHOOK_PATH}`;
  },

  // XML request builders
  buildXmlRequest: (jsonData) => {
    const builder = new Builder({
      headless: true,
      renderOpts: {
        pretty: true,
        indent: "  ",
        newline: "\n",
      },
      xmldec: { version: "1.0", encoding: "UTF-8" },
      attrkey: "$",
      attrValueProcessors: [(value) => value.toString()],
      cdata: true,
    });
    return builder.buildObject(jsonData);
  },

  // Common request sections
  buildAgentSection: () => ({
    $: { Id: igoConfig.agentId }, // sets attribute
    Password: igoConfig.agentPassword,
    Reference: `AgentRef_${Date.now()}`,
    Time: new Date().toISOString(),
  }),

  buildVendorSection: () => ({
    $: { Id: igoConfig.vendorId },
  }),

  buildPricingSection: ({ pricingModel, paymentPoint, price, flags = [] }) => ({
    Model: pricingModel,
    PaymentPoint: paymentPoint,
    Price: price,
    Flags: flags,
  }),

  buildJourneySection: ({ pickup, dropoff, time }) => {
    // Build the journey section in the format required by iGo Protocol V1.41
    return {
      From: {
        Type: "Coordinate",
        Coordinate: {
          Latitude: pickup.lat,
          Longitude: pickup.lng,
        },
        ...(pickup.address ? { Address: pickup.address } : {}),
      },
      To: {
        Type: "Coordinate",
        Coordinate: {
          Latitude: dropoff.lat,
          Longitude: dropoff.lng,
        },
        ...(dropoff.address ? { Address: dropoff.address } : {}),
      },
      Time: new Date(time).toISOString(),
    };
  },

  buildPassengerSection: (passengers) => ({
    PassengerDetails: passengers.map((passenger) => ({
      $: { IsLead: passenger.isLead ? "true" : "false" },
      Name: passenger.name,
      TelephoneNumber: passenger.phone,
      EmailAddress: passenger.email,
    })),
  }),

  // Update the igoConfig object to include bid statuses and bid types
  bidStatuses: {
    AVAILABLE: "AVAILABLE",
    UNAVAILABLE: "UNAVAILABLE",
    PARTIAL: "PARTIAL",
  },

  bidTypes: {
    IMMEDIATE: "IMMEDIATE",
    PREBOOK: "PREBOOK",
    BOTH: "BOTH",
  },

  webhookUrl: `${
    process.env.API_BASE_URL || "http://localhost:5000"
  }/api/rides/webhook/igo`,
  mockMode: process.env.IGO_MOCK_MODE === "true" || true,
};

export default igoConfig;
