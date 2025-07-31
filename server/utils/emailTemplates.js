const getWelcomeEmailTemplate = (userName) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: #f6f6f6; color: #333; }
    .email-container { max-width: 600px; margin: auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
    .header { background: #f2f2f2; padding: 20px; text-align: center; }
    .header img { max-height: 60px; }
    .content { padding: 30px; }
    .button { display: inline-block; background: #1a73e8; color: #fff; padding: 12px 20px; border-radius: 5px; text-decoration: none; margin-top: 20px; }
    .footer { font-size: 12px; text-align: center; color: #888; padding: 20px; background: #fafafa; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <img src="http://localhost:5173/logo.jpg" alt="Zappy Taxis" />
    </div>
    <div class="content">
      <h2>Welcome, ${userName} 👋</h2>
      <p>Thanks for registering with <strong>Zappy Taxis</strong>! We're excited to help you with your upcoming journeys across the UK.</p>
      <ul>
        <li>🚖 Easy ride booking</li>
        <li>📍 Live trip tracking</li>
        <li>💳 Secure online payments</li>
        <li>💬 Support from real people</li>
      </ul>
      <a href="${process.env.FRONTEND_URL}" class="button">Start Booking</a>
    </div>
    <div class="footer">
      This message was sent to you as part of your account registration. Questions? Just reply to this email.
    </div>
  </div>
</body>
</html>
`;

const getQuoteEmailTemplate = (quoteDetails) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; background: #f9f9f9; margin: 0; padding: 0; }
    .email-container { max-width: 600px; margin: auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); overflow: hidden; }
    .header { background: #f2f2f2; padding: 20px; text-align: center; }
    .header img { max-height: 60px; }
    .content { padding: 30px; }
    .button { background: #1a73e8; color: white; padding: 10px 18px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; }
    .footer { background: #fafafa; padding: 15px; text-align: center; font-size: 12px; color: #888; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <img src="${process.env.FRONTEND_URL}/logo.jpg" alt="Zappy Taxis" />
    </div>
    <div class="content">
      <h2>Hello ${quoteDetails.userName},</h2>
      <p>🎉 We've found some great options for your trip! Check them out before they expire.</p>
      <p>Quotes are valid for the next 30 minutes.</p>
      <a href="${process.env.FRONTEND_URL}/quotes" class="button">View Your Quotes</a>
    </div>
    <div class="footer">
      Contact our support if you have any questions. We're here to help!
    </div>
  </div>
</body>
</html>
`;

const getBookingConfirmationTemplate = (bookingDetails) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; background: #f6f6f6; margin: 0; padding: 0; }
    .email-container { max-width: 600px; margin: auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background: #f2f2f2; text-align: center; padding: 20px; }
    .header img { max-height: 60px; }
    .content { padding: 30px; }
    .booking-info { background: #f9f9f9; padding: 20px; border-radius: 5px; margin-top: 20px; }
    .label { font-weight: bold; color: #444; }
    .button { display: inline-block; margin-top: 20px; background: #1a73e8; color: white; padding: 12px 18px; border-radius: 5px; text-decoration: none; }
    .footer { font-size: 12px; text-align: center; color: #999; padding: 15px; background: #fafafa; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <img src="${process.env.FRONTEND_URL}/logo.jpg" alt="Zappy Taxis" />
    </div>
    <div class="content">
      <h2>🎉 Booking Confirmed!</h2>
      <p>Thanks for booking with Zappy Taxis, ${bookingDetails.userName}.</p>
      <div class="booking-info">
        <p><span class="label">Booking ID:</span> ${bookingDetails.bookingId}</p>
        <p><span class="label">Pickup:</span> ${bookingDetails.pickup}</p>
        <p><span class="label">Dropoff:</span> ${bookingDetails.dropoff}</p>
        <p><span class="label">Date & Time:</span> ${bookingDetails.dateTime}</p>
        <p><span class="label">Vehicle Type:</span> ${bookingDetails.vehicleType}</p>
        <p><span class="label">Fare:</span> £${bookingDetails.fare}</p>
      </div>
      <a href="${process.env.FRONTEND_URL}/bookings/${bookingDetails.bookingId}" class="button">Track Your Ride</a>
    </div>
    <div class="footer">
      Driver details will be sent to you closer to pickup time. Need changes? Contact us.
    </div>
  </div>
</body>
</html>
`;

module.exports = {
  getWelcomeEmailTemplate,
  getQuoteEmailTemplate,
  getBookingConfirmationTemplate,
};

