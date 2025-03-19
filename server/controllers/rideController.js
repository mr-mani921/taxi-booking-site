import Ride from "../models/Ride.js";
import Driver from "../models/Driver.js";

// @desc   Book a new ride
// @route  POST /api/rides/book
// @access Private (Only logged-in users)
export const bookRide = async (req, res) => {
  const { pickupLocation, dropoffLocation, fare } = req.body;

  try {
    const ride = new Ride({
      user: req.user._id, // User from authMiddleware
      pickupLocation,
      dropoffLocation,
      fare,
    });

    await ride.save();
    res.status(201).json({ message: "Ride booked successfully!", ride });
  } catch (error) {
    res.status(500).json({ message: "Ride booking failed!", error });
  }
};

// @desc   Get all rides for a user
// @route  GET /api/rides/my
// @access Private (Only logged-in users)
export const getUserRides = async (req, res) => {
  try {
    const rides = await Ride.find({ user: req.user._id }).sort({
      bookedAt: -1,
    });
    res.json(rides);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch rides", error });
  }
};

// @desc   Get all rides (Admin only)
// @route  GET /api/rides
// @access Private (Admin)
export const getAllRides = async (req, res) => {
  try {
    const rides = await Ride.find().populate("user", "name email");
    res.json(rides);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch rides", error });
  }
};

// @desc   Update ride status (Accept, Complete, Cancel)
// @route  PUT /api/rides/:id/status
// @access Private (Admin or Driver)
export const updateRideStatus = async (req, res) => {
  const { status } = req.body;

  try {
    const ride = await Ride.findById(req.params.id);

    if (!ride) {
      return res.status(404).json({ message: "Ride not found" });
    }

    ride.status = status;
    if (status === "Completed") ride.completedAt = Date.now();

    await ride.save();
    res.json({ message: `Ride marked as ${status}`, ride });
  } catch (error) {
    res.status(500).json({ message: "Failed to update ride status", error });
  }
};

// @desc Assign a driver to a ride
// @route PUT /api/rides/:id/assign
// @access Private (Admin or System)
export const assignDriver = async (req, res) => {
  const { driverId } = req.body;

  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) {
      return res.status(404).json({ message: "Ride not found" });
    }

    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({ message: "Driver not found" });
    }

    if (!driver.availability) {
      return res.status(400).json({ message: "Driver is not available" });
    }

    ride.driver = driverId;
    ride.status = "Accepted";
    await ride.save();

    io.emit("rideStatusChanged", { rideId: ride._id, status: "Accepted" });

    res.json({ message: "Driver assigned successfully!", ride });
  } catch (error) {
    res.status(500).json({ message: "Failed to assign driver", error });
  }
};
// @desc Mark ride as completed
// @route PUT /api/rides/:id/complete
// @access Private (Admin or Driver)
export const completeRide = async (req, res) => {
    try {
      const ride = await Ride.findById(req.params.id);
      if (!ride) {
        return res.status(404).json({ message: "Ride not found" });
      }
  
      if (ride.status !== "Accepted") {
        return res.status(400).json({ message: "Ride cannot be completed" });
      }
  
      ride.status = "Completed";
      ride.completedAt = Date.now();
  
      if (ride.driver) {
        const driver = await Driver.findById(ride.driver);
        driver.availability = true;
        await driver.save();
      }
  
      await ride.save();
      io.emit("rideStatusChanged", { rideId: ride._id, status: "Completed" });
  
      res.json({ message: "Ride completed successfully!", ride });
    } catch (error) {
      res.status(500).json({ message: "Failed to complete ride", error });
    }
  };
  