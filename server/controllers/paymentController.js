const stripe = require("../utils/stripe.js");

const createPaymentIntent = async (req, res) => {
  const { amount, currency = "gbp", description } = req.body;

  try {
    // Convert pounds to pence for Stripe (smallest currency unit)
    const amountInPence = Math.round(amount * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInPence,
      currency,
      description,
      capture_method: "manual",
    });


    res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error("Stripe PaymentIntent creation failed:", error.message);
    res.status(500).json({
      success: false,
      message: error.message,
      error: error.message,
    });
  }
};

/**
 * Capture a held payment (after successful iGo booking)
 */
const capturePayment = async (req, res) => {
  const { paymentIntentId } = req.body;

  try {
    const intent = await stripe.paymentIntents.capture(paymentIntentId);
    res.status(200).json({ success: true, data: intent });
  } catch (error) {
    console.error("Error capturing payment:", error.message);
    res.status(500).json({
      success: false,
      message: "Payment capture failed",
      error: error.message,
    });
  }
};

/**
 * Cancel a payment hold (if iGo booking fails)
 */
const cancelPayment = async (req, res) => {
  const { paymentIntentId } = req.body;

  try {
    const intent = await stripe.paymentIntents.cancel(paymentIntentId);
    res.status(200).json({ success: true, data: intent });
  } catch (error) {
    console.error("Error canceling payment:", error.message);
    res.status(500).json({
      success: false,
      message: "Payment cancelation failed",
      error: error.message,
    });
  }
};

module.exports = {
  createPaymentIntent,
  capturePayment,
  cancelPayment,
};
