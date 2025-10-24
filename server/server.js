const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/dbConfig.js"); // Import DB connection function
const passport = require("./config/passport.js"); // Import Passport config
const authRoutes = require("./routes/authRoutes.js"); // Authentication routes
const rideRoutes = require("./routes/rideRoutes.js"); // Ride routes
const userRoutes = require("./routes/userRoutes.js"); // User routes
const quoteRoutes = require("./routes/quoteRoutes.js"); // Quote routes with email notifications
// const driverRoutes = require("./routes/driverRoutes.js"); // Driver routes
const paymentRoutes = require("./routes/paymentRoutes.js"); // Payment routes
const igoEventRoutes = require("./routes/igoEventRoutes.js"); // iGo event routes
const verificationRoutes = require("./routes/verificationRoutes.js"); // Email verification routes
const { notFound, errorHandler } = require("./middlewares/errorMiddleware.js"); // Custom error handlers
const http = require("http");
const path = require("path");
const { initScheduledJobs } = require("./jobs/scheduledJobs.js");
const Sentry = require("@sentry/node");
const { initSocketIO } = require("./services/socketService.js");
const { verifyIgoWebhookSignature } = require("./middlewares/webhookAuth.js");
const { handleIgoEvent } = require("./services/igoService.js");

// __dirname is already available in CommonJS

const envPath = path.join(__dirname, ".env");

// Load environment variables
dotenv.config({ path: envPath });

console.log(process.env.NODE_ENV);

const app = express();

// Initialize Sentry for error monitoring in production
if (process.env.NODE_ENV === "production" && process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    integrations: [
      // Enable HTTP calls tracing
      new Sentry.Integrations.Http({ tracing: true }),
      // Enable Express.js middleware tracing
      new Sentry.Integrations.Express({ app }),
    ],
    // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring
    tracesSampleRate: 1.0,
  });
}

// Trust proxy - needed for rate limiting when behind a proxy
app.set("trust proxy", 1);

const server = http.createServer(app);
const PORT = process.env.PORT || 5000; // Default to 5000 for compatibility with tests

// Initialize Socket.IO
const io = initSocketIO(server);

// Setup rate limiting for production
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "production" ? 200 : 300, // Increase limits
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests from this IP, please try again after 15 minutes",
  skip: (req) => {
    // Skip rate limiting for event history endpoints in development
    return (
      process.env.NODE_ENV !== "production" &&
      req.path.startsWith("/api/events/history")
    );
  },
});

// Initialize Sentry request handler
app.use(Sentry.Handlers.requestHandler());

// Middleware setup
app.use(
  cors({
    origin:process.env.FRONTEND_URL , // Restrict CORS in production
    credentials: true,
  })
);
app.use(helmet()); // Security headers
app.use(morgan("dev")); // Logger

// Add XML parsing middleware first, then JSON
app.use(express.text({ type: "application/xml" })); // Add text parser for XML content
app.use(express.json({ limit: "1mb" })); // Body parser for JSON with size limit
app.use(cookieParser()); // Cookie parser

// Initialize Passport
app.use(passport.initialize());

// Apply rate limiting to all API routes in production
app.use("/api/", apiLimiter);

// Routes
app.use("/api/user/", userRoutes);
app.use("/api/auth", authRoutes); // Enable auth routes for Google OAuth
app.use("/api/rides/", rideRoutes);
// app.use("/api/drivers", driverRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/events", igoEventRoutes);
app.use("/api/verification", verificationRoutes);

// Health check endpoint for tests
app.get("/health-check", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Server is running",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// Default route
app.get("/", (req, res) => {
  res.send("Taxi Booking API is running...");
});

// Initialize Sentry error handler
app.use(Sentry.Handlers.errorHandler());

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

// Start server
server.listen(PORT, async () => {
  try {
    await connectDB();
    console.log(
      `️🏽‍➡️Server running in ${
        process.env.NODE_ENV || "development"
      } mode on port ${PORT}`
    );
    console.log(`🔍 Health check: http://127.0.0.1:${PORT}/health-check`);
    console.log(`🔗 API base URL: http://127.0.0.1:${PORT}/api`);
    console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL}`);

    // Initialize scheduled jobs
    if (process.env.NODE_ENV !== "test") {
      initScheduledJobs();
      console.log("✅ Scheduled jobs initialized");
    }
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
});

// Export for testing purposes
module.exports = { app, server };
