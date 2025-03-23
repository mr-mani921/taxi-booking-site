import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const envPath = join(__dirname, ".env");

// Load environment variables
dotenv.config({ path: envPath });

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000; // Default to 5000 for compatibility with tests

const io = new Server(server, {
  cors: {
    origin: "*", // Allow frontend to connect
    methods: ["GET", "POST"],
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

// Middleware setup
app.use(cors()); // Enable CORS
app.use(helmet()); // Security headers
app.use(morgan("dev")); // Logger
app.use(express.json()); // Body parser for JSON
app.use(cookieParser()); // Cookie parser

// Routes
app.use("/api/user/", userRoutes); // Changed from user to users to match test config
// app.use("/api/auth", authRoutes); // User authentication routes
app.use("/api/ride/", rideRoutes); // Changed from ride to rides to match test config
// app.use("/api/drivers", driverRoutes); // Driver-related routes
app.use("/api/payment", paymentRoutes); // Payment-related routes

// Health check endpoint for tests
app.get("/health-check", (req, res) => {
  res.status(200).json({ status: "ok", message: "Server is running" });
});

// Default route
app.get("/", (req, res) => {
  res.send("Taxi Booking API is running...");
});

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

// Start server
server.listen(PORT, () => {
  console.log(`🏃🏽‍➡️ Server running on port ${PORT}`);
  console.log(`🔍 Health check: http://127.0.0.1:${PORT}/health-check`);
  console.log(`🔗 API base URL: http://127.0.0.1:${PORT}/api`);
});
