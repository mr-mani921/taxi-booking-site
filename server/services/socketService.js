const { Server } = require("socket.io");

let io;

const initSocketIO = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
    },
    transports: ["websocket", "polling"],
    pingTimeout: 60000,
    pingInterval: 25000,
    cookie: false,
    allowEIO3: true,
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    // Join a ride room
    socket.on("joinRideRoom", (identifier) => {
      const roomId = `ride_${identifier}`;
      socket.join(roomId);
      console.log(
        `Client ${socket.id} joined ride room with identifier: ${identifier}, room: ${roomId}`
      );
    });

    // Leave a ride room
    socket.on("leaveRideRoom", (identifier) => {
      const roomId = `ride_${identifier}`;
      socket.leave(roomId);
      console.log(
        `Client ${socket.id} left ride room with identifier: ${identifier}, room: ${roomId}`
      );
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  return io;
};

// Emit ride status update to all clients in the ride room
const emitRideUpdate = (rideId, data) => {
  if (!io) {
    console.warn("Socket.IO not initialized");
    return;
  }
  const roomId = `ride_${rideId}`;
  console.log(`Emitting ride update for room ${roomId}:`, data);
  io.to(roomId).emit("rideUpdate", data);
};

// Emit driver location update to all clients in the ride room
const emitDriverLocation = (rideId, location) => {
  if (!io) {
    console.warn("Socket.IO not initialized");
    return;
  }
  const roomId = `ride_${rideId}`;
  io.to(roomId).emit("driverLocationUpdate", location);
};

// Emit payment status update to all clients in the ride room
const emitPaymentUpdate = (rideId, paymentData) => {
  if (!io) {
    console.warn("Socket.IO not initialized");
    return;
  }
  const roomId = `ride_${rideId}`;
  io.to(roomId).emit("paymentUpdate", paymentData);
};

// Emit notification to specific client
const emitNotification = (userId, notification) => {
  if (!io) {
    console.warn("Socket.IO not initialized");
    return;
  }
  io.to(`user_${userId}`).emit("notification", notification);
};

module.exports = {
  initSocketIO,
  emitRideUpdate,
  emitDriverLocation,
  emitPaymentUpdate,
  emitNotification,
};
