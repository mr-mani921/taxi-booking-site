import { Server } from "socket.io";

let io;

export const initSocketIO = (server) => {
  io = new Server(server, {
    cors: {
      origin:
        process.env.NODE_ENV === "production" ? process.env.FRONTEND_URL : "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    // Join a ride room
    socket.on("joinRideRoom", (rideId) => {
      socket.join(`ride_${rideId}`);
      console.log(`Client ${socket.id} joined ride room: ${rideId}`);
    });

    // Leave a ride room
    socket.on("leaveRideRoom", (rideId) => {
      socket.leave(`ride_${rideId}`);
      console.log(`Client ${socket.id} left ride room: ${rideId}`);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  return io;
};

// Emit ride status update to all clients in the ride room
export const emitRideUpdate = (rideId, data) => {
  if (!io) {
    console.warn("Socket.IO not initialized");
    return;
  }
  io.to(`ride_${rideId}`).emit("rideUpdate", data);
};

// Emit driver location update to all clients in the ride room
export const emitDriverLocation = (rideId, location) => {
  if (!io) {
    console.warn("Socket.IO not initialized");
    return;
  }
  io.to(`ride_${rideId}`).emit("driverLocationUpdate", location);
};

// Emit payment status update to all clients in the ride room
export const emitPaymentUpdate = (rideId, paymentData) => {
  if (!io) {
    console.warn("Socket.IO not initialized");
    return;
  }
  io.to(`ride_${rideId}`).emit("paymentUpdate", paymentData);
};

// Emit notification to specific client
export const emitNotification = (userId, notification) => {
  if (!io) {
    console.warn("Socket.IO not initialized");
    return;
  }
  io.to(`user_${userId}`).emit("notification", notification);
};
