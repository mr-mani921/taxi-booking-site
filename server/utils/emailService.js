const nodemailer = require("nodemailer");
const {
  getWelcomeEmailTemplate,
  getQuoteEmailTemplate,
  getBookingConfirmationTemplate,
} = require("./emailTemplates");

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // Keep track of sent emails to prevent duplicates
    this.sentEmails = new Set();
  }

  async sendEmail(to, subject, html, uniqueIdentifier = null) {
    console.log(`Sending email to: ${to}, Subject: ${subject}`);
    // If uniqueIdentifier is provided, check for duplicates
    if (uniqueIdentifier && this.sentEmails.has(uniqueIdentifier)) {
      console.log(`Duplicate email prevented: ${uniqueIdentifier}`);
      return false;
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      html,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);

      // If successful and has uniqueIdentifier, add to sent emails
      if (uniqueIdentifier) {
        this.sentEmails.add(uniqueIdentifier);
        console.log(`Email sent with unique identifier: ${uniqueIdentifier}`);
        // Clear identifier after 1 hour to prevent memory leaks
        setTimeout(() => this.sentEmails.delete(uniqueIdentifier), 3600000);
      }

      console.log("Email sent successfully:", info.messageId);
      return true;
    } catch (error) {
      console.error("Error sending email:", error);
      return false;
    }
  }

  async sendWelcomeEmail(user) {
    console.log(`Sending welcome email to: ${user.email}`);
    const uniqueId = `welcome_${user._id}_${Date.now()}`;
    const html = getWelcomeEmailTemplate(user.name || "there");

    return this.sendEmail(
      user.email,
      "Welcome to Our Taxi Service!",
      html,
      uniqueId
    );
  }

  async sendQuoteEmail(user, quoteDetails) {
    const uniqueId = `quote_${user._id}_${Date.now()}`;
    const html = getQuoteEmailTemplate({
      userName: user.name || "there",
      ...quoteDetails,
    });

    return this.sendEmail(
      user.email,
      "Your Ride Quotes Are Ready!",
      html,
      uniqueId
    );
  }

  async sendBookingConfirmationEmail(user, bookingDetails) {
    const uniqueId = `booking_${bookingDetails.bookingId}`;
    const html = getBookingConfirmationTemplate({
      userName: user.name || "there",
      ...bookingDetails,
    });

    return this.sendEmail(
      user.email,
      "Your Ride Booking Confirmation",
      html,
      uniqueId
    );
  }
}

// Create a singleton instance
const emailService = new EmailService();

module.exports = emailService;
