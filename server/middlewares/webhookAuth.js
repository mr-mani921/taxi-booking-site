import crypto from "crypto";

/**
 * Middleware to verify iGo webhook signatures
 *
 * This middleware verifies that incoming webhook requests are authentic
 * by validating the signature in the request headers against a computed
 * HMAC signature of the request body.
 *
 * To use in production:
 * 1. Obtain a webhook secret from iGo
 * 2. Set it in your .env file as IGO_WEBHOOK_SECRET
 * 3. Apply this middleware to your webhook routes
 */
export const verifyIgoWebhookSignature = (req, res, next) => {
  // Skip verification in development/test mode if configured to do so
  if (
    process.env.NODE_ENV !== "production" &&
    process.env.SKIP_WEBHOOK_VERIFICATION === "true"
  ) {
    console.log(
      "⚠️ WARNING: Skipping webhook signature verification in non-production environment"
    );
    return next();
  }

  try {
    // Get the signature from headers
    const signature = req.headers["x-igo-signature"];
    if (!signature) {
      console.error("Missing X-IGO-Signature header");
      return res
        .status(401)
        .json({ error: "Webhook signature verification failed" });
    }

    // Get the webhook secret from environment variables
    const webhookSecret = process.env.IGO_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("Missing IGO_WEBHOOK_SECRET environment variable");
      return res.status(500).json({ error: "Server configuration error" });
    }

    // Get the raw request body as a string
    const requestBody =
      typeof req.body === "string" ? req.body : JSON.stringify(req.body);

    // Compute the expected HMAC signature
    const hmac = crypto.createHmac("sha256", webhookSecret);
    const expectedSignature = hmac.update(requestBody).digest("hex");

    // Constant-time string comparison to prevent timing attacks
    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );

    if (!isValid) {
      console.error("Invalid webhook signature");
      return res
        .status(401)
        .json({ error: "Webhook signature verification failed" });
    }

    // Signature is valid, proceed
    next();
  } catch (error) {
    console.error("Error verifying webhook signature:", error);
    return res
      .status(500)
      .json({ error: "Webhook signature verification error" });
  }
};

/**
 * Apply additional rate limiting specifically for webhooks
 * to prevent abuse of the webhook endpoint
 */
export const webhookRateLimit = (req, res, next) => {
  // Implement rate limiting logic here or use a library like express-rate-limit
  // This is a simplified placeholder implementation
  const MAX_REQUESTS_PER_MINUTE = 60; // Adjust based on expected load

  // Use a more sophisticated rate limiter in production
  next();
};
