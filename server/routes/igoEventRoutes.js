import express from "express";
import {
  handleIgoEvent,
  simulateIgoEvent,
  getEventHistory,
} from "../controllers/igoEventController.js";
import { verifyIgoWebhookSignature } from "../middlewares/webhookAuth.js";

const router = express.Router();

// Endpoints for testing/simulation
// Main endpoint for incoming iGo events
router.post("/:eventName", handleIgoEvent);
router.post("/simulate/:eventType", simulateIgoEvent);
router.get("/history/:bookingReference", getEventHistory);

export default router;
