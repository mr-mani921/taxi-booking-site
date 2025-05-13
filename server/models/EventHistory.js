const mongoose = require("mongoose");

const eventHistorySchema = new mongoose.Schema(
  {
    eventType: {
      type: String,
      required: true,
      index: true,
    },
    authorizationReference: {
      type: String,
      index: true,
    },
    bookingReference: {
      type: String,
      index: true,
    },
    rideId: {
      type: String,
      index: true,
    },
    eventData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    processed: {
      type: Boolean,
      default: true,
    },
    processingResult: {
      status: String,
      message: String,
      details: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// Automatically expire old events after 30 days
eventHistorySchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 30 * 24 * 60 * 60 }
);

const EventHistory = mongoose.model("EventHistory", eventHistorySchema);

module.exports = EventHistory;
