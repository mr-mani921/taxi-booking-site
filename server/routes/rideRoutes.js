import express from "express";
import {
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
  authorizeBooking,
} from "../controllers/rideController.js";
import {
  verifyIgoWebhookSignature,
  webhookRateLimit,
} from "../middlewares/webhookAuth.js";
import { authenticateUser } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Public routes (no authentication required)
router.post(
  "/webhook/igo",
  webhookRateLimit,
  verifyIgoWebhookSignature,
  handleIgoWebhook
);

// Protected routes (authentication required)
router.post("/quotes/estimate", authenticateUser, getPriceEstimate);
// router.post("/check-availability", authenticateUser, checkRideAvailability);
router.post("/book", authenticateUser, bookRide);
router.post("/cancel/:id", authenticateUser, cancelRide);
router.get("/status/:id", authenticateUser, getRideStatus);
router.get("/history", authenticateUser, getUserRides);
// router.get("/vehicle-types", authenticateUser, getSavedVehicleTypes);

// Bid-related routes
router.post("/request-bids", authenticateUser, requestVendorBids);
router.post("/select-bid", authenticateUser, selectBid);
router.post("/book", authenticateUser, bookRide );
router.post("/authorize", authenticateUser, authorizeBooking)


export default router;
