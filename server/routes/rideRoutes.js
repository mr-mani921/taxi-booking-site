import express from "express";
import {
  bookRide,
  getUserRides,
  getAllRides,
  updateRideStatus,
} from "../controllers/rideController.js";
import { assignDriver } from "../controllers/rideController.js";
import { authenticateAdmin , authenticateUser } from "../middlewares/authMiddleware.js"

const router = express.Router();

// Book a ride
router.post("/book", authenticateUser, bookRide);

// Get all rides for logged-in user
router.get("/my", authenticateUser, getUserRides);

// Get all rides (AtuhauthenticateAdmin only)
router.get("/", authenticateUser, authenticateAdmin, getAllRides);

// Update ride status (AtuhauthenticateAdmin or Driver)
router.put("/:id/status", authenticateUser, authenticateAdmin, updateRideStatus);

// Assign a driver to a ride (AtuhauthenticateAdmin only)
router.put("/:id/assign", authenticateUser, authenticateAdmin, assignDriver);
export default router;
