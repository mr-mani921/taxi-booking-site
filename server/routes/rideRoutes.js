import express from "express";
import {
  checkRideAvailability,
  bookRide,
  getRideStatus,
  cancelRide,
  handleIgoWebhook,
  getPriceEstimate,
  getUserRides,
  requestVendorBids,
  getBidsByReference,
  selectBid,
  processPayment,
  requestBill,
  getReceipt,
} from "../controllers/rideController.js";
import { authenticateUser } from "../middlewares/authMiddleware.js"; // Ensure user is authenticated

const router = express.Router();

// Protected routes (require authentication)
router.post("/estimate", authenticateUser, getPriceEstimate);
router.post("/availability", authenticateUser, checkRideAvailability);
router.post("/book", authenticateUser, bookRide);
router.get("/status/:bookingId", authenticateUser, getRideStatus);
router.delete("/cancel/:bookingId", authenticateUser, cancelRide);
router.get("/user/:userId", authenticateUser, getUserRides);
router.post("/bids", authenticateUser, requestVendorBids);
router.get("/bids/:bidReference", authenticateUser, getBidsByReference);
router.post("/bids/select", authenticateUser, selectBid);

// Payment processing
router.post("/:id/payment", authenticateUser, processPayment);
router.get("/:id/bill", authenticateUser, requestBill);
router.get("/:id/receipt", authenticateUser, getReceipt);

// Webhook endpoint for iGo events (no authentication required)
router.post("/webhook/igo", handleIgoWebhook);

export default router;
