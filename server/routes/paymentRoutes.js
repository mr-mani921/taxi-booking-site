import express from "express";
import { capturePayment, cancelPayment, createPaymentIntent } from "../controllers/paymentController.js";

const router = express.Router();

router.post("/payment-intent", createPaymentIntent);
router.post("/capture", capturePayment);
router.post("/cancel", cancelPayment);

export default router;
