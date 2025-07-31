const asyncHandler = require("express-async-handler");
const emailService = require("../utils/emailService");

// Helper to format quote details for email
const formatQuoteDetails = (
  quotes,
  pickupLocation,
  dropoffLocation,
  pickupTime
) => {
  const bestQuote = quotes.reduce((min, quote) =>
    quote.estimatedPrice < min.estimatedPrice ? quote : min
  );

  return {
    pickup: pickupLocation.address,
    dropoff: dropoffLocation.address,
    date: new Date(pickupTime).toLocaleString(),
    price: bestQuote.estimatedPrice.toFixed(2),
  };
};

// Send email after quotes are retrieved
const sendQuoteEmail = asyncHandler(async (req, res, next) => {
  const { quotes } = res.locals;
  const { pickupLocation, dropoffLocation, pickupTime } = req.body;

  if (quotes && quotes.length > 0 && req.user) {
    const quoteDetails = formatQuoteDetails(
      quotes,
      pickupLocation,
      dropoffLocation,
      pickupTime
    );

    // Send email non-blocking
    emailService
      .sendQuoteEmail(req.user, quoteDetails)
      .catch((error) => console.error("Failed to send quote email:", error));
  }

  next();
});

module.exports = {
  sendQuoteEmail,
};
