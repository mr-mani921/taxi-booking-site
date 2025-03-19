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

const envPath = join(__dirname, "/config/config.env");
dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

const io = new Server(server, {
  cors: {
    origin: "*", // Allow frontend to connect
    methods: ["GET", "POST"],
  },
});

console.log("the port is " + process.env.PORT);

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


// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Initialize Express app

// Middleware setup
app.use(cors()); // Enable CORS
app.use(helmet()); // Security headers
app.use(morgan("dev")); // Logger
app.use(express.json()); // Body parser for JSON
app.use(cookieParser()); // Cookie parser

// Routes
app.use("/api/user/",userRoutes)
// app.use("/api/auth", authRoutes); // User authentication routes
app.use("/api/ride", rideRoutes); // Ride booking & management routes
// app.use("/api/drivers", driverRoutes); // Driver-related routes
app.use("/api/payment", paymentRoutes); // Payment-related routes


// Default route
app.get("/", (req, res) => {
  res.send("Taxi Booking API is running...");
});

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

// Start server

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});