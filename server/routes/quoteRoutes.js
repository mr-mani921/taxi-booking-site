const express = require("express");
const { authenticateUser } = require("../middlewares/authMiddleware");
const { getPriceEstimate } = require("../controllers/rideController");
const emailService = require("../utils/emailService");

const router = express.Router();

// Quote route with email notification middleware
router.post(
  "/quotes",
  authenticateUser,
  async (req, res, next) => {
    const originalJson = res.json;
    res.json = function (data) {
      // If quotes were successfully retrieved, send email
      if (data && data.quotes && data.quotes.length > 0 && req.user) {
        const quoteDetails = {
          pickup: req.body.pickupLocation.address,
          dropoff: req.body.dropoffLocation.address,
          date: new Date(req.body.pickupTime).toLocaleDateString(),
          time: new Date(req.body.pickupTime).toLocaleTimeString(),
          price: data.estimatedPrice,
        };

        emailService
          .sendQuoteEmail(req.user, quoteDetails)
          .catch((err) => console.error("Failed to send quote email:", err));
      }
      return originalJson.call(this, data);
    };
    next();
  },
  getPriceEstimate
);

module.exports = router;
