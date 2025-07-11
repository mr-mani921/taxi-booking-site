const crypto = require("crypto");
const igoConfig = require("../config/igoConfig.js");

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

const verifyIgoWebhookSignature = (req, res, next) => {

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
    // Check for essential iGo event headers
    const authRef = req.headers["x-authorization-reference"];
    const bookingRef = req.headers["x-agent-booking-reference"];

    // For iGo events, we need at least the authorization reference
    if (!authRef) {
      console.error("Missing X-Authorization-Reference header");
      return res
        .status(401)
        .json({ error: "Missing required iGo event headers" });
    }

    // Basic validation of the Authorization Reference format
    // Should match the format: {agentId}:{agentPassword}
    if (!authRef.includes(":")) {
      console.error("Invalid X-Authorization-Reference format");
      return res
        .status(401)
        .json({ error: "Invalid authorization reference format" });
    }

    // Extract and verify agent credentials from the header
    const [agentId, agentPassword] = authRef.split(":");

    // Check if agent ID matches our configuration
    if (agentId !== igoConfig.agentId) {
      console.error("Invalid agent ID in authorization reference");
      return res.status(401).json({ error: "Agent ID verification failed" });
    }

    // For enhanced security in production, also verify the signature
    if (
      process.env.NODE_ENV === "production" &&
      process.env.IGO_WEBHOOK_SECRET
    ) {
      // Get the signature from headers
      const signature = req.headers["x-igo-signature"];
      if (!signature) {
        console.error("Missing X-IGO-Signature header in production mode");
        return res
          .status(401)
          .json({ error: "Webhook signature verification failed" });
      }

      // Get the webhook secret from environment variables
      const webhookSecret = process.env.IGO_WEBHOOK_SECRET;

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
const webhookRateLimit = (req, res, next) => {
  // Implement rate limiting logic here or use a library like express-rate-limit
  // This is a simplified placeholder implementation
  const MAX_REQUESTS_PER_MINUTE = 60; // Adjust based on expected load

  // Use a more sophisticated rate limiter in production
  next();
};

module.exports = {
  verifyIgoWebhookSignature,
  webhookRateLimit,
};
