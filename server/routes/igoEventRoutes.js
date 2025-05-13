const express = require("express");
const {
  handleIgoEvent,
  simulateIgoEvent,
  getEventHistory,
} = require("../controllers/igoEventController.js");
const { verifyIgoWebhookSignature } = require("../middlewares/webhookAuth.js");

const router = express.Router();

// Endpoints for testing/simulation
// Main endpoint for incoming iGo events
router.post("/:eventName", handleIgoEvent);
router.post("/simulate/:eventType", simulateIgoEvent);
router.get("/history/:bookingReference", getEventHistory);

module.exports = router;
