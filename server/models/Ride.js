import mongoose from "mongoose";
import igoConfig from "../config/igoConfig.js";

const passengerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    isLead: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const driverSchema = new mongoose.Schema(
  {
    name: {
      type: String,
    },
    phone: {
      type: String,
    },
    vehicleDetails: {
      type: String,
    },
    licenseNumber: {
      type: String,
    },
    estimatedArrivalTime: {
      type: Date,
    },
    actualArrivalTime: {
      type: Date,
    },
  },
  { _id: false }
);

const rideSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    driver: {
      type: driverSchema,
      default: null,
    },
    pickupLocation: {
      type: String,
      required: true,
    },
    dropoffLocation: {
      type: String,
      required: true,
    },
    pickupTime: {
      type: Date,
      required: true,
    },
    estimatedArrivalTime: {
      type: Date,
    },
    actualArrivalTime: {
      type: Date,
    },
    journeyStartTime: {
      type: Date,
    },
    journeyEndTime: {
      type: Date,
    },
    fare: {
      type: Number,
      required: true,
      default: 0,
    },
    finalFare: {
      type: Number,
    },
    status: {
      type: String,
      enum: Object.values(igoConfig.rideStatuses),
      default: igoConfig.rideStatuses.PENDING,
    },
    // iGo specific fields
    igoBookingId: {
      type: String,
      index: true,
    },
    igoAvailabilityReference: {
      type: String,
    },
    igoAuthorizationReference: {
      type: String,
    },
    pricingModel: {
      type: String,
      enum: Object.values(igoConfig.pricingModels),
      default: igoConfig.pricingModels.UP_FRONT,
    },
    paymentPoint: {
      type: String,
      enum: Object.values(igoConfig.paymentPoints),
      default: igoConfig.paymentPoints.TIME_OF_BOOKING,
    },
    vehicleType: {
      type: String,
      enum: Object.values(igoConfig.vehicleTypes),
      default: igoConfig.vehicleTypes.STANDARD,
    },
    pricingFlags: [
      {
        type: String,
        enum: Object.values(igoConfig.pricingFlags),
      },
    ],
    passengers: [passengerSchema],
    specialInstructions: {
      type: String,
      default: "",
    },
    driverNotes: {
      type: String,
      default: "",
    },
    cancellationReason: {
      type: String,
    },
    // Response logs for debugging
    igoResponseLogs: [
      {
        type: {
          type: String,
          enum: ["authorization", "status", "event"],
        },
        data: mongoose.Schema.Types.Mixed,
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // Event history
    eventHistory: [
      {
        type: {
          type: String,
          enum: Object.values(igoConfig.eventTypes),
        },
        data: mongoose.Schema.Types.Mixed,
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
rideSchema.index({ status: 1 });
rideSchema.index({ user: 1, status: 1 });
rideSchema.index({ igoAuthorizationReference: 1 });

// Method to update ride status with iGo event data
rideSchema.methods.updateFromIgoEvent = function (eventType, eventData) {
  // Store the event data
  this.eventHistory.push({
    type: eventType,
    data: eventData,
    timestamp: new Date(),
  });

  // Update status and related fields based on event type
  switch (eventType) {
    case igoConfig.eventTypes.DRIVER_ASSIGNED:
      this.driver = {
        name: eventData.Driver?.Name,
        phone: eventData.Driver?.TelephoneNumber,
        vehicleDetails: eventData.Driver?.VehicleDetails,
        licenseNumber: eventData.Driver?.LicenseNumber,
        estimatedArrivalTime: eventData.EstimatedArrivalTime
          ? new Date(eventData.EstimatedArrivalTime)
          : null,
      };
      break;

    case igoConfig.eventTypes.DRIVER_ARRIVED:
      this.driver.actualArrivalTime = new Date();
      break;

    case igoConfig.eventTypes.JOURNEY_STARTED:
      this.status = igoConfig.rideStatuses.IN_PROGRESS;
      this.journeyStartTime = new Date();
      break;

    case igoConfig.eventTypes.JOURNEY_COMPLETED:
      this.status = igoConfig.rideStatuses.COMPLETED;
      this.journeyEndTime = new Date();
      if (eventData.FinalPrice) {
        this.finalFare = parseFloat(eventData.FinalPrice);
      }
      break;

    case igoConfig.eventTypes.DISPATCHED:
      this.status = igoConfig.rideStatuses.DISPATCHED;
      break;

    case igoConfig.eventTypes.COMPLETED:
      this.status = igoConfig.rideStatuses.COMPLETED;
      this.completedAt = new Date();
      break;

    case igoConfig.eventTypes.CANCELLED:
      this.status = igoConfig.rideStatuses.CANCELLED;
      this.cancellationReason =
        eventData.CancellationReason || "Cancelled by dispatch system";
      this.cancelledAt = new Date();
      break;

    case igoConfig.eventTypes.FAILED:
      this.status = igoConfig.rideStatuses.FAILED;
      this.cancellationReason = eventData.FailureReason || "Booking failed";
      this.cancelledAt = new Date();
      break;
  }

  return this;
};

const Ride = mongoose.model("Ride", rideSchema);
export default Ride;
