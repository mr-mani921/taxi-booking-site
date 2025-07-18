import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import io from "socket.io-client";
import {
  FaUser,
  FaCarSide,
  FaMapMarkerAlt,
  FaCheck,
  FaSpinner,
  FaClock,
  FaExclamationTriangle,
  FaLocationArrow,
  FaInfoCircle,
} from "react-icons/fa";
import { useSelector } from "react-redux";
import api from "../api/api";

const RideTracking = ({
  rideId,
  bookingReference,
  authorizationReference,
  onRideComplete,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rideStatus, setRideStatus] = useState("BOOKED");
  const [driverDetails, setDriverDetails] = useState(null);
  const [events, setEvents] = useState([]);
  const [socket, setSocket] = useState(null);
  const lastFetchRef = useRef(0);
  const isMountedRef = useRef(true);
  const { selectedQuote } = useSelector((state) => state.quote);

  useEffect(() => {}, []);
  // Define updateRideStatusFromEvents first since it's used by fetchEvents
  const updateRideStatusFromEvents = (eventList) => {
    // Find the most recent status-changing event
    const statusEvents = eventList.filter(
      (event) =>
        event.eventType.includes("Dispatched") ||
        event.eventType.includes("VehicleArrived") ||
        event.eventType.includes("PassengerOnBoard") ||
        event.eventType.includes("Completed") ||
        event.eventType.includes("Cancelled")
    );

    if (statusEvents.length > 0) {
      const latestEvent = statusEvents[statusEvents.length - 1];

      // Extract driver details if available
      if (latestEvent.eventData && latestEvent.eventData.Driver) {
        try {
          const eventData = latestEvent.eventData;
          if (eventData && eventData.Driver) {
            setDriverDetails({
              name: eventData.Driver.Name,
              phone: eventData.Driver.TelephoneNumber,
              vehicleDetails: eventData.Driver.VehicleDetails,
              photoUrl: eventData.Driver.PhotoUrl || null,
              licensePlate: eventData.Driver.VehicleDetails?.RegistrationNumber,
              estimatedArrival: eventData.EstimatedArrivalTime,
            });
          }
        } catch (err) {
          console.error("Error parsing driver details:", err);
        }
      }

      // Update status based on event type
      if (latestEvent.eventType.includes("Dispatched")) {
        setRideStatus("DISPATCHED");
      } else if (latestEvent.eventType.includes("VehicleArrived")) {
        setRideStatus("VEHICLE_ARRIVED");
      } else if (latestEvent.eventType.includes("PassengerOnBoard")) {
        setRideStatus("PASSENGERONBOARD");
      } else if (latestEvent.eventType.includes("Completed")) {
        setRideStatus("COMPLETED");
        if (onRideComplete) onRideComplete();
      } else if (latestEvent.eventType.includes("Cancelled")) {
        setRideStatus("CANCELLED");
      }
    }
  };

  // Fetch ride events - defined before any useEffect that uses it
  const fetchEvents = useCallback(async () => {
    if (!bookingReference || loading) return;

    try {
      setLoading(true);
      setError(null);
      const response = await api.getEventsHistory(bookingReference);

      if (isMountedRef.current) {
        if (response.data.success) {
          const sortedEvents = response.data.events.sort(
            (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
          );
          setEvents(sortedEvents);

          // Update ride status based on the most recent event
          if (sortedEvents.length > 0) {
            updateRideStatusFromEvents(sortedEvents);
          }
        }
        setLoading(false);
      }
    } catch (err) {
      console.error("Error fetching ride events:", err);
      if (isMountedRef.current) {
        setError("Failed to fetch ride updates");
        setLoading(false);
      }
    }
  }, [bookingReference, loading, onRideComplete]);

  // Connect to socket.io on component mount
  useEffect(() => {
    const socketUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

    const newSocket = io(socketUrl, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
    });

    // Add connection event handlers
    newSocket.on("connect", () => {
      setSocket(newSocket);
    });

    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    newSocket.on("reconnect_attempt", (attemptNumber) => {});

    // Listen for ride updates
    newSocket.on("rideUpdate", (data) => {
      if (data.status) setRideStatus(data.status.toUpperCase());
      if (data.driverDetails) setDriverDetails(data.driverDetails);

      // Fetch latest events when we get an update
      fetchEvents();
    });

    // Listen for driver location updates if we implement that feature
    newSocket.on("driverLocationUpdate", (locationData) => {
      // Update driver location on map if we had a map component
    });

    // Cleanup on unmount
    return () => {
      isMountedRef.current = false;
      newSocket.disconnect();
    };
  }, [fetchEvents]);

  // Fetch events on initial mount as soon as bookingReference is available
  useEffect(() => {
    if (bookingReference && isMountedRef.current) {
      fetchEvents();
    }
  }, [bookingReference, fetchEvents]);

  // Join ride room when we have a booking reference
  useEffect(() => {
    if (socket && bookingReference) {
      // Use rideId if available, otherwise use bookingReference
      const roomIdentifier = rideId || bookingReference;
      socket.emit("joinRideRoom", roomIdentifier);

      return () => {
        socket.emit("leaveRideRoom", roomIdentifier);
      };
    }
  }, [socket, bookingReference, rideId]);

  // Format time relative to now
  const formatRelativeTime = (dateString) => {
    if (!dateString) return "";

    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
      return "just now";
    } else if (diffInSeconds < 3600) {
      const mins = Math.floor(diffInSeconds / 60);
      return `${mins} minute${mins > 1 ? "s" : ""} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? "s" : ""} ago`;
    }
  };

  // Format actual time
  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Get the status icon based on current step
  const getStatusIcon = (step) => {
    const statusMap = {
      BOOKED: <FaCheck className="text-blue-600" />,
      DISPATCHED: <FaCheck className="text-blue-600" />,
      VEHICLE_ARRIVED: <FaCheck className="text-blue-600" />,
      PASSENGERONBOARD: <FaCheck className="text-blue-600" />,
      COMPLETED: <FaCheck className="text-green-600" />,
      CANCELLED: <FaExclamationTriangle className="text-red-600" />,
    };

    const currentStepIndex = [
      "BOOKED",
      "DISPATCHED",
      "VEHICLEARRIVED",
      "PASSENGERONBOARD",
      "COMPLETED",
    ].indexOf(rideStatus);

    const stepIndex = [
      "BOOKED",
      "DISPATCHED",
      "VEHICLEARRIVED",
      "PASSENGERONBOARD",
      "COMPLETED",
    ].indexOf(step);

    if (rideStatus === "CANCELLED") {
      return step === rideStatus ? (
        statusMap[step]
      ) : (
        <div className="w-3 h-3 rounded-full bg-gray-300"></div>
      );
    }

    if (stepIndex < currentStepIndex + 1) {
      return <FaCheck className="text-green-600" />;
    } else if (stepIndex === currentStepIndex + 1) {
      return loading ? (
        <FaSpinner className="text-blue-600 animate-spin" />
      ) : (
        statusMap[step]
      );
    } else {
      return <div className="w-3 h-3 rounded-full bg-gray-300"></div>;
    }
  };

  // Return estimated arrival information
  const getEstimatedArrival = () => {
    if (!driverDetails || !driverDetails.estimatedArrival) return null;

    const eta = new Date(driverDetails.estimatedArrival);
    const now = new Date();
    const diffInMinutes = Math.round((eta - now) / 60000);

    if (diffInMinutes <= 0) return "Arriving now";
    return `Arriving in ${diffInMinutes} min`;
  };

  return (
    <div className="ride-tracking-container rounded-lg overflow-hidden border border-gray-200 shadow-md">
      {/* Status Header */}
      <div
        className={`p-4 ${
          rideStatus === "COMPLETED"
            ? "bg-green-100"
            : rideStatus === "CANCELLED"
            ? "bg-red-100"
            : "bg-blue-100"
        }`}
      >
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">
            Ride Status: {rideStatus.replace(/_/g, " ")}
          </h3>
          <div className="flex items-center">
            {loading && (
              <FaSpinner className="animate-spin text-gray-700 mr-2" />
            )}
            <button
              onClick={fetchEvents}
              className="bg-white hover:bg-gray-100 rounded-full p-2 transition-colors shadow-sm"
              disabled={loading}
            >
              <FaSpinner
                className={`text-gray-700 ${loading ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-2 p-2 bg-red-100 text-red-700 text-sm rounded">
            {error}
          </div>
        )}
      </div>

      {/* Driver Information (if available) */}
      <AnimatePresence>
        {driverDetails &&
          ["VEHICLE_ARRIVED", "PASSENGERONBOARD"].includes(rideStatus) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="p-4 border-b border-gray-200"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0 w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border border-gray-300">
                  {driverDetails.photoUrl ? (
                    <img
                      src={driverDetails.photoUrl}
                      alt={driverDetails.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FaUser className="text-2xl text-gray-500" />
                  )}
                </div>

                <div className="ml-4 flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-gray-800">
                        {driverDetails.name}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {driverDetails.phone}
                      </p>
                    </div>
                    {driverDetails.estimatedArrival && (
                      <div className="bg-blue-100 py-1 px-3 rounded-full text-blue-700 text-sm">
                        {getEstimatedArrival()}
                      </div>
                    )}
                  </div>

                  <div className="mt-2 flex items-center text-sm">
                    <FaCarSide className="text-gray-600 mr-1" />
                    <span className="text-gray-700">
                      {driverDetails.vehicleDetails?.Make}{" "}
                      {driverDetails.vehicleDetails?.Model},{" "}
                      {driverDetails.vehicleDetails?.Color}
                      {driverDetails.licensePlate &&
                        ` • ${driverDetails.licensePlate}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mt-4 flex space-x-2">
                <button className="flex-1 py-2 rounded bg-blue-100 text-blue-700 flex items-center justify-center hover:bg-blue-200 transition-colors">
                  <FaLocationArrow className="mr-2" /> Live Location
                </button>
                <a
                  href={`tel:${driverDetails.phone}`}
                  className="flex-1 py-2 rounded bg-green-100 text-green-700 flex items-center justify-center hover:bg-green-200 transition-colors"
                >
                  Call Driver
                </a>
              </div>
            </motion.div>
          )}
      </AnimatePresence>

      {/* Status Timeline */}
      <div className="p-4">
        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200" />

          {/* Timeline Steps */}
          <div className="space-y-6">
            {/* Booking Confirmed */}
            <div className="relative pl-10">
              <div className="absolute left-0 top-0 w-6 h-6 rounded-full flex items-center justify-center bg-white border-2 border-gray-200">
                {getStatusIcon("BOOKED")}
              </div>
              <h4 className="text-gray-800 font-medium">Booking Confirmed</h4>
              <p className="text-sm text-gray-600">
                Your ride has been booked and payment confirmed
              </p>
            </div>

            {/* Ride Dispatched */}
            <div className="relative pl-10">
              <div className="absolute left-0 top-0 w-6 h-6 rounded-full flex items-center justify-center bg-white border-2 border-gray-200">
                {getStatusIcon("DISPATCHED")}
              </div>
              <h4 className="text-gray-800 font-medium">Ride Dispatched</h4>
              <p className="text-sm text-gray-600">
                Your ride request has been sent to nearby drivers
              </p>
            </div>

            {/* Vehicle Arrived */}
            <div className="relative pl-10">
              <div className="absolute left-0 top-0 w-6 h-6 rounded-full flex items-center justify-center bg-white border-2 border-gray-200">
                {getStatusIcon("VEHICLEARRIVED")}
              </div>
              <h4 className="text-gray-800 font-medium">Vehicle Arrived</h4>
              <p className="text-sm text-gray-600">
                Your vehicle has arrived at the pickup location
              </p>
            </div>

            {/* Passenger On Board */}
            <div className="relative pl-10">
              <div className="absolute left-0 top-0 w-6 h-6 rounded-full flex items-center justify-center bg-white border-2 border-gray-200">
                {getStatusIcon("PASSENGERONBOARD")}
              </div>
              <h4 className="text-gray-800 font-medium">Passenger On Board</h4>
              <p className="text-sm text-gray-600">
                Your passenger has boarded the vehicle
              </p>
            </div>

            {/* Ride Completed */}
            {rideStatus !== "CANCELLED" && (
              <div className="relative pl-10">
                <div className="absolute left-0 top-0 w-6 h-6 rounded-full flex items-center justify-center bg-white border-2 border-gray-200">
                  {getStatusIcon("COMPLETED")}
                </div>
                <h4 className="text-gray-800 font-medium">Ride Completed</h4>
                <p className="text-sm text-gray-600">
                  You've arrived at your destination
                </p>
              </div>
            )}

            {/* Cancelled Status (only shown if ride is cancelled) */}
            {rideStatus === "CANCELLED" && (
              <div className="relative pl-10">
                <div className="absolute left-0 top-0 w-6 h-6 rounded-full flex items-center justify-center bg-white border-2 border-red-400">
                  {getStatusIcon(rideStatus)}
                </div>
                <h4 className="text-red-600 font-medium">Ride Cancelled</h4>
                <p className="text-sm text-gray-600">
                  This ride has been cancelled
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Events */}
      {events.length > 0 && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <h4 className="text-gray-800 font-medium mb-3">Recent Updates</h4>
          <div className="space-y-3 max-h-40 overflow-y-auto">
            {events
              .slice(-5)
              .reverse()
              .map((event, index) => (
                <div key={index} className="flex items-start">
                  <div className="w-2 h-2 mt-1.5 rounded-full bg-blue-500 mr-2"></div>
                  <div>
                    <p className="text-sm text-gray-800">
                      {event.eventType
                        .replace(/Agent|Booking|Event|Request/g, "")
                        .replace(/([A-Z])/g, " $1")
                        .trim()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatRelativeTime(event.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Help Info */}
      <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center">
        <FaInfoCircle className="text-gray-500 mr-2" />
        <span className="text-sm text-gray-600">
          Need help with your ride? Call our support at Info@zappytaxis.com
        </span>
      </div>
    </div>
  );
};

export default RideTracking;
