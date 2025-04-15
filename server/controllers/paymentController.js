import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createPaymentIntent = async (req, res) => {
    const { amount, currency = "usd", description } = req.body;
  
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency,
        description,
        capture_method: "manual", // pre-auth only
      });

      console.log("payment intent created...", paymentIntent.client_secret);
      
      res.status(200).json({
        success: true,
        clientSecret: paymentIntent.client_secret,
      });
    } catch (error) {
      console.error("Stripe PaymentIntent creation failed:", error.message);
      res.status(500).json({
        success: false,
        message: "Failed to create payment intent",
        error: error.message,
      });
    }
  };
  

/**
 * Capture a held payment (after successful iGo booking)
 */
export const capturePayment = async (req, res) => {
  const { paymentIntentId } = req.body;

  try {
    const intent = await stripe.paymentIntents.capture(paymentIntentId);
    res.status(200).json({ success: true, data: intent });
  } catch (error) {
    console.error("Error capturing payment:", error.message);
    res.status(500).json({ success: false, message: "Payment capture failed", error: error.message });
  }
};

/**
 * Cancel a payment hold (if iGo booking fails)
 */
export const cancelPayment = async (req, res) => {
  const { paymentIntentId } = req.body;

  try {
    const intent = await stripe.paymentIntents.cancel(paymentIntentId);
    res.status(200).json({ success: true, data: intent });
  } catch (error) {
    console.error("Error canceling payment:", error.message);
    res.status(500).json({ success: false, message: "Payment cancelation failed", error: error.message });
  }
};
