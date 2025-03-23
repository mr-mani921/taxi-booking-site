import mongoose from "mongoose";
import igoConfig from "../config/igoConfig.js";

// Schema for price band information
const priceBandSchema = new mongoose.Schema(
  {
    currency: {
      type: String,
      required: true,
      default: "GBP",
    },
    minimumPrice: {
      type: Number,
      required: true,
    },
    maximumPrice: {
      type: Number,
      required: true,
    },
    estimatedPrice: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

// Schema for individual vendor bids
const vendorBidSchema = new mongoose.Schema(
  {
    vendorId: {
      type: String,
      required: true,
    },
    vendorName: {
      type: String,
      required: true,
    },
    priceBand: {
      type: priceBandSchema,
      required: true,
    },
    etaInMinutes: {
      type: Number,
      required: true,
    },
    vehicleType: {
      type: String,
      required: true,
    },
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
export default Bid;
