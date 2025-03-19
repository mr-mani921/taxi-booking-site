import mongoose from "mongoose";

const rideSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference to User Model
      required: true,
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver", // Reference to Driver Model (optional initially)
      default: null,
    },
    pickupLocation: {
      type: String,
      required: true,
    },
    dropoffLocation: {
      type: String,
      required: true,
    },
    fare: {
      type: Number,
      required: true,
      default: 0, // Initial fare (can be updated)
    },
    status: {
      type: String,
      enum: ["Pending", "Accepted", "Completed", "Cancelled"],
      default: "Pending", // Default status
    },
    bookedAt: {
      type: Date,
      default: Date.now, // Booking time
    },
    completedAt: {
      type: Date, // Ride completion time (if completed)
    },
  },
  { timestamps: true } // Adds createdAt & updatedAt fields
);

const Ride = mongoose.model("Ride", rideSchema);
export default Ride;
