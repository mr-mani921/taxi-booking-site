const mongoose = require("mongoose");
const igoConfig = require("../config/igoConfig.js");

// Schema for price band information
const pricingSchema = new mongoose.Schema(
  {
    pricingMethod: String,
    price: Number,
    commission: Number,
    gratuity: Number,
    currency: {
      type: String,
      default: "GBP",
    },
    loyaltyCard: Number,
    promotionCodeDiscount: Number,
    priceNET: Number,
    serviceCharge: Number,
    VAT: Number,
    marketPlaceCommission: Number,
    marketPlaceCommissionVAT: Number,
    serviceChargeVAT: Number,
    agentCommission: Number,
    agentCommissionVAT: Number,
    cancellationCharge: Number,
    noFareCharge: Number,
    areaCharge: Number,
    surgeFactor: Number,
  },
  { _id: false }
);

// Schema for individual vendor bids
const vendorBidSchema = new mongoose.Schema(
  {
    vendorId: String,
    vendorName: String,
    vendorAddress: String,
    vendorCity: String,
    vendorCountry: String,
    vendorPhone: String,
    rating: String,
    numberOfRatings: Number,
    vehicleType: String,
    etaInMinutes: Number,
    pricing: {
      type: pricingSchema,
    },
    estimatedDistance: Number,
    estimatedDuration: Number,
  },
  { _id: false }
);

// Main bid schema
const bidSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    bidReference: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      required: true,
      enum: Object.values(igoConfig.bidStatuses),
      default: igoConfig.bidStatuses.AVAILABLE,
    },
    bidType: {
      type: String,
      required: true,
      enum: Object.values(igoConfig.bidTypes),
      default: igoConfig.bidTypes.IMMEDIATE,
    },
    pickup: {
      address: { type: String, required: true },
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    dropoff: {
      address: { type: String, required: true },
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    requestedTime: {
      type: Date,
      required: true,
    },
    passengersCount: {
      type: Number,
      default: 1,
    },
    luggageCount: {
      type: Number,
      default: 0,
    },
    receivedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    bids: {
      type: [vendorBidSchema],
      required: true,
    },
    selectedBid: {
      type: vendorBidSchema,
    },

    igoResponseLog: {
      type: String,
    },
    authorizationReference: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Set expiration time when saving
bidSchema.pre("save", function (next) {
  if (!this.expiresAt) {
    // Default expiration is 5 minutes after bid creation
    this.expiresAt = new Date(Date.now() + 5 * 60 * 1000);
  }
  next();
});

const Bid = mongoose.model("Bid", bidSchema);
module.exports = Bid;
