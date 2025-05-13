const express = require("express");
const {
  capturePayment,
  cancelPayment,
  createPaymentIntent,
} = require("../controllers/paymentController.js");

const router = express.Router();

router.post("/payment-intent", createPaymentIntent);
router.post("/capture", capturePayment);
router.post("/cancel", cancelPayment);

module.exports = router;
