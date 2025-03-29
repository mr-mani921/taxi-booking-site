import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import connectDB from "./config/dbConfig.js"; // Import DB connection function
// import authRoutes from "./routes/authRoutes.js"; // Authentication routes
import rideRoutes from "./routes/rideRoutes.js"; // Ride routes (to be created)
import userRoutes from "./routes/userRoutes.js"; // User routes (to be created)
// import driverRoutes from "./routes/driverRoutes.js"; // Driver routes (to be created)
import paymentRoutes from "./routes/paymentRoutes.js"; // Payment routes (to be created)
import { notFound, errorHandler } from "./middlewares/errorMiddleware.js"; // Custom error handlers
import { Server } from "socket.io";
import http from "http";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { join } from "path";
import { initScheduledJobs } from "./jobs/scheduledJobs.js";
import * as Sentry from "@sentry/node";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const envPath = join(__dirname, ".env");

// Load environment variables
dotenv.config({ path: envPath });

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

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000; // Default to 5000 for compatibility with tests

const io = new Server(server, {
  cors: {
    origin:
      process.env.NODE_ENV === "production" ? process.env.FRONTEND_URL : "*", // Restrict origin in production
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Listen for connections
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("rideStatusUpdate", (data) => {
    io.emit("rideStatusChanged", data); // Notify all clients about status change
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.id);
  });
});

// Connect to MongoDB
connectDB();

// Setup rate limiting for production
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "production" ? 100 : 0, // Limit each IP in production
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests from this IP, please try again after 15 minutes",
});

// Initialize Sentry request handler
app.use(Sentry.Handlers.requestHandler());

// Middleware setup
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production" ? process.env.FRONTEND_URL : "*", // Restrict CORS in production
    credentials: true,
  })
);
app.use(helmet()); // Security headers
app.use(morgan("dev")); // Logger
app.use(express.json({ limit: "1mb" })); // Body parser for JSON with size limit
app.use(cookieParser()); // Cookie parser

// Apply rate limiting to all API routes in production
app.use("/api/", apiLimiter);

// Routes
app.use("/api/user/", userRoutes); // Changed from user to users to match test config
// app.use("/api/auth", authRoutes); // User authentication routes
app.use("/api/ride/", rideRoutes); // Changed from ride to rides to match test config
// app.use("/api/drivers", driverRoutes); // Driver-related routes
app.use("/api/payment", paymentRoutes); // Payment-related routes

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
server.listen(PORT, () => {
  console.log(
    `🏃🏽‍➡️Server running in ${
      process.env.NODE_ENV || "development"
    } mode on port ${PORT}`
  );
  console.log(`🔍 Health check: http://127.0.0.1:${PORT}/health-check`);
  console.log(`🔗 API base URL: http://127.0.0.1:${PORT}/api`);

  // Initialize scheduled jobs
  if (process.env.NODE_ENV !== "test") {
    initScheduledJobs();
    console.log("✅ Scheduled jobs initialized");
  }
});
