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
    passengers: [passengerSchema],
    pickupLocation: {
      address: { type: String, required: true },
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
    },
    dropoffLocation: {
      address: { type: String, required: true },
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
    },
    pickupTime: { type: Date, required: true },
    estimatedArrivalTime: { type: Date },
    actualArrivalTime: { type: Date },
    journeyStartTime: { type: Date },
    journeyEndTime: { type: Date },
    fare: { type: Number, required: true },
    originalFare: { type: Number },
    finalFare: { type: Number },
    platformMarkup: { type: String },
    status: {
      type: String,
      enum: Object.values(igoConfig.rideStatuses),
      default: igoConfig.rideStatuses.PENDING,
    },
    specialInstructions: { type: String },
    // iGo specific fields
    igoBookingId: { type: String },
    igoAvailabilityReference: { type: String },
    igoAuthorizationReference: { type: String },
    pricingModel: {
      type: String,
      enum: Object.values(igoConfig.pricingModels),
    },
    paymentPoint: {
      type: String,
      enum: Object.values(igoConfig.paymentPoints),
    },
    vehicleType: { type: String },
    pricingFlags: [String],
    // Logging fields
    igoResponseLogs: [
      {
        timestamp: { type: Date, default: Date.now },
        requestType: String,
        response: mongoose.Schema.Types.Mixed,
      },
    ],
    eventHistory: [
      {
        timestamp: { type: Date, default: Date.now },
        eventType: String,
        eventData: mongoose.Schema.Types.Mixed,
      },
    ],
    // Payment-related fields
    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED"],
      default: "PENDING",
    },
    paymentMethod: {
      type: String,
      enum: ["CARD"],
    },
    paymentReference: { type: String },
    paymentTransactionReference: { type: String },
    paymentDate: { type: Date },
    paymentCardDetails: {
      cardType: String,
      lastFourDigits: String,
      expiryMonth: String,
      expiryYear: String,
    },
    // Commission details for platform
    commissionDetails: {
      commissionAmount: { type: Number },
      vendorAmount: { type: Number },
      commissionPercentage: { type: String },
      markupPercentage: { type: String },
      calculatedAt: { type: Date },
    },
    billDetails: {
      billItems: [
        {
          description: String,
          amount: String,
          type: String,
        },
      ],
      subTotal: String,
      tax: String,
      total: String,
      currency: String,
      paymentStatus: String,
    },
    receiptDetails: {
      receiptNumber: String,
      vendorName: String,
      bookingReference: String,
      paymentReference: String,
      journeyDetails: {
        startTime: Date,
        endTime: Date,
        pickupAddress: String,
        dropoffAddress: String,
        distance: String,
      },
      billItems: [
        {
          description: String,
          amount: String,
          type: String,
        },
      ],
      subTotal: String,
      tax: String,
      total: String,
      currency: String,
      paymentMethod: String,
      paymentTime: Date,
      receiptURL: String,
    },
  },
  { timestamps: true }
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
