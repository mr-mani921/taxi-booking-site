import express from "express";
// import { createPaymentSession } from "../controllers/paymentController.js";
import { authenticateUser } from "../middlewares/authMiddleware.js";

const router = express.Router();

// router.post("/create-session", protect, createPaymentSession);

export default router;
