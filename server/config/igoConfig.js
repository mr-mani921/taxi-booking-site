/**
 * iGo API Configuration
 * This file contains all configuration settings for the iGo integration
 */

const dotenv = require("dotenv");
const { Builder } = require("xml2js");

dotenv.config();
console.log("IGO_AGENT_ID:", process.env.IGO_AGENT_ID);

// Default values for testing environment
const defaults = {
  // API URLs
  API_URL: process.env.IGO_API_URL,
  EVENT_BASE_URL: process.env.IGO_EVENT_BASE_URL,

  // Credentials
  AGENT_ID: process.env.IGO_AGENT_ID,
  AGENT_PASSWORD: process.env.IGO_AGENT_PASSWORD,
  VENDOR_ID: process.env.IGO_VENDOR_ID,
  APP_ID: process.env.IGO_APP_ID,

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
  appId: process.env.IGO_APP_ID || defaults.APP_ID,

  // Request configuration
  apiTimeout: parseInt(process.env.IGO_API_TIMEOUT || defaults.API_TIMEOUT),

  // Pricing models (as per iGo Protocol V1.41)
  pricingModels: {
    UP_FRONT: "UpFront",
    Fixed: "FixedPrice",
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
    VEHICLE_ARRIVED: "VehicleArrived",
    PASSENGER_ON_BOARD: "PassengerOnBoard",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
  },

  // Event types (as per iGo Protocol V1.41)
  eventTypes: {
    DISPATCHED: "AgentBookingDispatchedEventRequest",
    VEHICLE_ARRIVED: "AgentVehicleArrivedEventRequest",
    PASSENGER_ON_BOARD: "AgentPassengerOnBoardEventRequest",
    COMPLETED: "AgentBookingCompletedEventRequest",
    CANCELLED: "AgentBookingCancelledEventRequest",
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

  // Generate proper UTC time for iGo API requests (within 5 minutes of current time)
  generateValidTime: () => {
    const now = new Date();
    // Ensure time is within 5 minutes of current time
    // Convert to UTC ISO string format as required by iGo API
    return now.toISOString();
  },

  // Convert UK time to UTC for iGo API requests
  convertUKTimeToUTC: (ukTime) => {
    // If ukTime is already a Date object, use it directly
    if (ukTime instanceof Date) {
      return ukTime.toISOString();
    }

    // If ukTime is a string, parse it and convert to UTC
    const date = new Date(ukTime);
    return date.toISOString();
  },

  // Convert date to local vendor time without timezone suffix (ISO 8601 format, no Z)
  // Used for BookingTime elements in XML requests
  convertToLocalVendorTime: (dateTime) => {
    let date;
    if (dateTime instanceof Date) {
      date = new Date(dateTime);
    } else {
      date = new Date(dateTime);
    }

    // Get local time components and format as ISO 8601 without Z
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    const milliseconds = String(date.getMilliseconds()).padStart(3, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}`;
  },

  // Convert old flags format to AllowedAddons format (space-separated string)
  // Valid values: "Extras" and/or "WaitingTime"
  convertFlagsToAllowedAddons: (flags = []) => {
    const allowedAddons = [];

    // Map old flag names to new AllowedAddons values
    if (Array.isArray(flags)) {
      flags.forEach((flag) => {
        if (
          flag === igoConfig.pricingFlags.ALLOW_EXTRAS ||
          flag === "AllowExtras"
        ) {
          if (!allowedAddons.includes("Extras")) {
            allowedAddons.push("Extras");
          }
        } else if (
          flag === igoConfig.pricingFlags.ALLOW_WAITING_TIME ||
          flag === "AllowWaitingTime"
        ) {
          if (!allowedAddons.includes("WaitingTime")) {
            allowedAddons.push("WaitingTime");
          }
        }
        // Ignore AllowTolls and AllowParking as they are invalid
      });
    }

    return allowedAddons.join(" "); // Return space-separated string
  },

  // Generate all required headers for iGo API requests
  generateApiHeaders: () => {
    const headers = {
      "Content-Type": "text/xml",
      Accept: "application/xml",
      "X-Authorization-Reference": `${igoConfig.agentId}:${igoConfig.agentPassword}`,
    };

    // Add App ID header if available
    if (igoConfig.appId) {
      headers["X-API-Application-Id"] = igoConfig.appId;
    }

    return headers;
  },

  // Validate credentials are loaded
  validateCredentials: () => {
    const missing = [];
    if (!igoConfig.agentId) missing.push("IGO_AGENT_ID");
    if (!igoConfig.agentPassword) missing.push("IGO_AGENT_PASSWORD");
    if (!igoConfig.vendorId) missing.push("IGO_VENDOR_ID");

    if (missing.length > 0) {
      throw new Error(
        `Missing required iGo credentials: ${missing.join(", ")}`
      );
    }

    return true;
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
    Time: igoConfig.generateValidTime(),
  }),

  // Build Vendors section (array of Vendor elements) - used for AgentBidRequest
  buildVendorSection: () => [
    {
      Vendor: {
        $: { Id: igoConfig.vendorId },
      },
    },
  ],

  // Build single Vendor element (not wrapped in Vendors) - used for AgentBookingAvailabilityRequest
  buildSingleVendorForAvailability: () => ({
    $: { Id: igoConfig.vendorId },
  }),

  // Build pricing section with modern AllowedAddons format (for AgentBookingAvailabilityRequest)
  buildPricingSection: ({
    pricingModel,
    paymentPoint,
    price,
    quotedPrice,
    allowedAddons,
    flags = [],
  }) => {
    const pricingObj = {
      Model: pricingModel,
      PaymentPoint: paymentPoint,
    };

    // Helper function to convert pounds (decimal) to pence (integer)
    // Protocol requires all monetary values as integers in pence (1 GBP = 100 pence)
    const convertToPence = (value) => {
      if (value === undefined || value === null || value === "") {
        return null;
      }
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      if (isNaN(numValue)) {
        return null;
      }
      // If value is >= 1000 and is a whole number, assume it's already in pence
      // Otherwise, assume it's in pounds and convert to pence
      if (numValue >= 1000 && Number.isInteger(numValue)) {
        // Already in pence (realistic taxi fares are usually 1000+ pence = £10+)
        return Math.round(numValue);
      } else {
        // Assume pounds and convert to pence
        return Math.round(numValue * 100);
      }
    };

    // Add Price only if provided and not empty/undefined
    // Convert to pence (integer) format as required by protocol
    if (price !== undefined && price !== null && price !== "") {
      const priceInPence = convertToPence(price);
      if (priceInPence !== null) {
        pricingObj.Price = priceInPence;
      }
    }

    // Convert flags to AllowedAddons format (only Extras and WaitingTime are valid)
    // If allowedAddons is explicitly provided, use it; otherwise convert from flags
    if (allowedAddons !== undefined && allowedAddons !== null) {
      if (typeof allowedAddons === "string" && allowedAddons.trim() !== "") {
        pricingObj.AllowedAddons = allowedAddons;
      } else if (Array.isArray(allowedAddons) && allowedAddons.length > 0) {
        pricingObj.AllowedAddons = allowedAddons.join(" ");
      }
    } else if (flags && flags.length > 0) {
      const convertedAddons = igoConfig.convertFlagsToAllowedAddons(flags);
      if (convertedAddons) {
        pricingObj.AllowedAddons = convertedAddons;
      }
    }

    // Add QuotedPrice if provided (required for AgentBookingAvailabilityRequest)
    // Convert to pence (integer) format - protocol requires integer pence values, no decimals
    if (
      quotedPrice !== undefined &&
      quotedPrice !== null &&
      quotedPrice !== ""
    ) {
      const quotedPriceInPence = convertToPence(quotedPrice);
      if (quotedPriceInPence !== null) {
        pricingObj.QuotedPrice = quotedPriceInPence;
      }
    }

    return pricingObj;
  },

  buildJourneySection: ({ pickup, dropoff, vias = [] }) => {
    // Validate that pickup and dropoff are provided
    if (!pickup || !dropoff) {
      throw new Error(
        `Missing required location data: pickup=${!!pickup}, dropoff=${!!dropoff}`
      );
    }

    // Build the journey section in the format required by iGo Protocol V1.41
    const journey = {
      From: {
        Type: "Address",
        Data: pickup.address || pickup.Address || "",
        Coordinate: {
          Latitude: pickup.lat || pickup.latitude || pickup.Latitude,
          Longitude: pickup.lng || pickup.longitude || pickup.Longitude,
        },
      },
      To: {
        Type: "Address",
        Data: dropoff.address || dropoff.Address || "",
        Coordinate: {
          Latitude: dropoff.lat || dropoff.latitude || dropoff.Latitude,
          Longitude: dropoff.lng || dropoff.longitude || dropoff.Longitude,
        },
      },
    };

    // Add Vias if any are provided
    if (vias.length > 0) {
      journey.Vias = {
        Via: vias.map((via) => ({
          Type: "Address",
          Data: via.address || "",
          Coordinate: {
            Latitude: via.lat,
            Longitude: via.lng,
          },
        })),
      };
    }

    return journey;
  },

  // Bid-specific journey builder to match Coordinate + Address + Time
  buildBidJourneySection: ({ pickup, dropoff, time }) => ({
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
    Time: igoConfig.convertToLocalVendorTime(time),
  }),

  buildPassengerSection: (passengers) => {
    // For the new schema, we expect a single passenger without IsLead attribute
    const leadPassenger = passengers.find((p) => p.isLead) ||
      passengers[0] || {
        name: "Default Passenger",
        phone: "",
        email: "",
        isLead: true,
      };

    return {
      PassengerDetails: {
        $: { IsLead: leadPassenger.isLead ? "true" : "false" },
        Name: leadPassenger.name,
        TelephoneNumber: leadPassenger.phone || "",
        EmailAddress: leadPassenger.email || "",
      },
    };
  },

  // Bid-specific passenger section with IsLead attribute
  buildBidPassengerSection: (passengers) => {
    const leadPassenger = passengers.find((p) => p.isLead) ||
      passengers[0] || {
        name: "Default Passenger",
        phone: "",
        email: "",
        isLead: true,
      };

    return {
      PassengerDetails: {
        $: { IsLead: leadPassenger.isLead ? "true" : "false" },
        Name: leadPassenger.name,
        TelephoneNumber: leadPassenger.phone || "",
        EmailAddress: leadPassenger.email || "",
      },
    };
  },

  buildRideSection: ({
    vehicleTypeEnum,
    vehicleCategory,
    passengerCount = 1,
    luggage = 0,
    facilities = "None",
  }) => ({
    $: { Type: "Passenger" }, // Type as attribute instead of child node
    Count: passengerCount.toString(),
    Luggage: luggage.toString(),
    Facilities: facilities,
    DriverType: "Any",
    VehicleType: vehicleTypeEnum,
    VehicleCategory: vehicleCategory,
  }),

  // Bid-specific ride section with Luggage support
  buildBidRideSection: ({
    vehicleTypeEnum,
    vehicleCategory,
    passengerCount = 1,
    luggage = 0,
    facilities = "None",
  }) => ({
    $: { Type: "Passenger" },
    Count: passengerCount.toString(),
    Luggage: luggage.toString(),
    VehicleType: vehicleTypeEnum,
    VehicleCategory: vehicleCategory,
    Facilities: facilities,
    DriverType: "Any",
  }),

  // Single vendor element for <Vendor Id="..."/> - used for AgentBidRequest
  buildSingleVendor: () => ({
    $: { Id: igoConfig.vendorId },
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

module.exports = igoConfig;
