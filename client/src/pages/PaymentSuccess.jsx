import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { motion } from "framer-motion";
import { resetPayment } from "../store/quoteSlice";
import {
  FaCarSide,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaClock,
  FaCheckCircle,
  FaCreditCard,
  FaSync,
  FaHistory,
  FaPlay,
} from "react-icons/fa";
import axios from "axios";
import io from "socket.io-client";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  // Get data from Redux store
  const selectedQuote = useSelector((state) => state.quote.selectedQuote);
  const bookingData = useSelector((state) => state.booking.bookingData);
  const paymentIntent = useSelector((state) => state.payment.paymentIntent);

  // Get payment data from URL state if available
  const paymentData = location.state?.paymentData;

  // State for ride status, event history, and socket connection
  const [rideStatus, setRideStatus] = useState("BOOKED");
  const [driverDetails, setDriverDetails] = useState(null);
  const [eventHistory, setEventHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  // Keep track of the last fetch time to prevent excessive API calls
  const lastFetchRef = useRef(0);
  // Flag to track if component is mounted
  const isMountedRef = useRef(true);

  // Generate reference number
  const bookingReference = selectedQuote?.bidReference;
  console.log("the bookingReference", bookingReference);

  // Authorization reference for iGo (usually from the backend)
  const authorizationReference =
    paymentData?.authorizationReference ||
    location.state?.authorizationReference ||
    "";

  useEffect(() => {
    // Redirect if no quote data is available
    if (!selectedQuote && !location.state?.selectedQuote) {
      navigate("/");
    }

    // Reset payment state when component unmounts
    return () => {
      dispatch(resetPayment());
      isMountedRef.current = false;
    };
  }, [selectedQuote, navigate, dispatch, location.state]);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(
      import.meta.env.VITE_API_URL || "http://localhost:5000"
    );
    setSocket(newSocket);

    // Listen for ride updates
    newSocket.on("rideUpdate", (data) => {
      setRideStatus(data.status);
      if (data.driverDetails) {
        setDriverDetails(data.driverDetails);
      }

      // Debounce fetch event history after receiving an update
      debouncedFetchEventHistory();
    });

    // Clean up socket connection
    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Debounced fetch event history function
  const debouncedFetchEventHistory = useCallback(() => {
    const now = Date.now();
    // Only fetch if at least 5 seconds have passed since the last fetch
    if (now - lastFetchRef.current > 5000) {
      lastFetchRef.current = now;
      fetchEventHistory();
    }
  }, []);

  // Join ride room for real-time updates
  useEffect(() => {
    if (socket && bookingReference) {
      socket.emit("joinRideRoom", bookingReference);

      // Initial fetch of event history (only once)
      if (lastFetchRef.current === 0) {
        lastFetchRef.current = Date.now();
        fetchEventHistory();
      }

      return () => {
        socket.emit("leaveRideRoom", bookingReference);
      };
    }
  }, [socket, bookingReference]);

  // Fetch event history
  const fetchEventHistory = async () => {
    if (!bookingReference || isLoading) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await axios.get(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:5000"
        }/api/events/history/${bookingReference}`,
        {
          // Add cache control headers to prevent browser caching
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
            Expires: "0",
          },
        }
      );

      // Only update state if component is still mounted
      if (isMountedRef.current) {
        if (response.data.success) {
          setEventHistory(response.data.events);
        }
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Error fetching event history:", err);
      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setError("Failed to fetch event history. Try again later.");
        setIsLoading(false);
      }
    }
  };

  // Simulate iGo event
  const simulateEvent = async (eventType) => {
    if (!bookingReference || !authorizationReference || isLoading) {
      setError("Missing booking or authorization reference");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Update last fetch time to prevent immediate history fetch after simulation
      lastFetchRef.current = Date.now();

      const response = await axios.post(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:5000"
        }/api/events/simulate/${eventType}`,
        {
          bookingReference,
          authorizationReference,
          eventData: {}, // You can add custom event data here if needed
        }
      );

      if (isMountedRef.current) {
        if (response.data.success) {
          // Wait a moment before fetching updated event history
          setTimeout(() => {
            if (isMountedRef.current) {
              fetchEventHistory();
            }
          }, 1000);
        } else {
          setError(response.data.message || "Failed to simulate event");
          setIsLoading(false);
        }
      }
    } catch (err) {
      console.error("Error simulating event:", err);
      if (isMountedRef.current) {
        setError(
          "Failed to simulate event: " +
            (err.response?.data?.message || err.message)
        );
        setIsLoading(false);
      }
    }
  };

  // Use location state data or Redux store data
  const quote = location.state?.selectedQuote || selectedQuote;
  const booking = location.state?.bookingData || bookingData;

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Format time
  const formatTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Format date for event history
  const formatEventTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (!quote || !booking) {
    return (
      <div className="min-h-screen bg-dark pt-20 flex items-center justify-center">
        <div className="text-center p-8">
          <h1 className="text-3xl font-bold text-white mb-4">
            No Booking Information
          </h1>
          <p className="text-gray-300 mb-6">
            We couldn't find your booking details.
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 bg-primary hover:bg-primary-dark rounded-md text-white font-semibold transition-colors"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark pt-20">
      {/* Hero Section */}
      <section className="relative py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-dark/50" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 text-green-500">
              <FaCheckCircle className="text-3xl" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Payment Successful!
            </h1>
            <p className="text-lg text-lightGray">
              Your ride has been booked and payment processed successfully
            </p>
          </motion.div>
        </div>
      </section>

      {/* Details Section */}
      <section className="py-16 bg-charcoal">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Booking Reference */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="glass-effect rounded-xl p-6 mb-8 text-center"
            >
              <h2 className="text-xl font-semibold text-lightGray mb-2">
                Your Booking Reference
              </h2>
              <p className="text-3xl font-mono font-bold text-primary">
                {bookingReference}
              </p>
              <p className="text-sm text-lightGray mt-2">
                Please save this reference for future inquiries
              </p>
            </motion.div>

            {/* Ride Status */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="glass-effect rounded-xl p-6 mb-8"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-white">Ride Status</h2>
                <button
                  onClick={fetchEventHistory}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary/20 text-primary hover:bg-primary/30 transition-colors"
                >
                  <FaSync className={isLoading ? "animate-spin" : ""} /> Refresh
                </button>
              </div>

              {/* Status Badge */}
              <div className="flex items-center mb-6">
                <div
                  className={`px-4 py-2 rounded-full ${
                    rideStatus === "BOOKED"
                      ? "bg-blue-500/20 text-blue-400"
                      : rideStatus === "DISPATCHED"
                      ? "bg-orange-500/20 text-orange-400"
                      : rideStatus === "IN_PROGRESS"
                      ? "bg-purple-500/20 text-purple-400"
                      : rideStatus === "COMPLETED"
                      ? "bg-green-500/20 text-green-400"
                      : rideStatus === "CANCELLED"
                      ? "bg-red-500/20 text-red-400"
                      : "bg-gray-500/20 text-gray-400"
                  } font-semibold text-lg`}
                >
                  {rideStatus}
                </div>
              </div>

              {/* Driver Details (if available) */}
              {driverDetails && (
                <div className="p-4 bg-dark/30 rounded-lg mb-4">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Driver Details
                  </h3>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <p className="text-sm text-lightGray">Name</p>
                      <p className="text-white">
                        {driverDetails.name || "Not assigned yet"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-lightGray">Phone</p>
                      <p className="text-white">
                        {driverDetails.phone || "N/A"}
                      </p>
                    </div>
                    {driverDetails.vehicleDetails && (
                      <>
                        <div>
                          <p className="text-sm text-lightGray">Vehicle</p>
                          <p className="text-white">
                            {driverDetails.vehicleDetails.Make}{" "}
                            {driverDetails.vehicleDetails.Model},
                            {driverDetails.vehicleDetails.Color}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-lightGray">Reg. Number</p>
                          <p className="text-white">
                            {driverDetails.vehicleDetails.RegistrationNumber}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Event Simulation Buttons (only in development) */}
              {import.meta.env.DEV && (
                <div className="mt-6 border-t border-gray-700 pt-4">
                  <h3 className="text-lg font-semibold text-white mb-3">
                    Test Event Simulation
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <button
                      onClick={() =>
                        simulateEvent("AgentBookingDispatchedEventRequest")
                      }
                      className="px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-md text-sm flex items-center justify-center gap-1"
                      disabled={isLoading}
                    >
                      <FaPlay className="text-xs" /> Dispatched
                    </button>
                    <button
                      onClick={() =>
                        simulateEvent("AgentBookingDriverAssignedEventRequest")
                      }
                      className="px-3 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 rounded-md text-sm flex items-center justify-center gap-1"
                      disabled={isLoading}
                    >
                      <FaPlay className="text-xs" /> Driver Assigned
                    </button>
                    <button
                      onClick={() =>
                        simulateEvent("AgentBookingDriverArrivedEventRequest")
                      }
                      className="px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-md text-sm flex items-center justify-center gap-1"
                      disabled={isLoading}
                    >
                      <FaPlay className="text-xs" /> Driver Arrived
                    </button>
                    <button
                      onClick={() =>
                        simulateEvent("AgentBookingJourneyStartedEventRequest")
                      }
                      className="px-3 py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded-md text-sm flex items-center justify-center gap-1"
                      disabled={isLoading}
                    >
                      <FaPlay className="text-xs" /> Journey Started
                    </button>
                    <button
                      onClick={() =>
                        simulateEvent(
                          "AgentBookingJourneyCompletedEventRequest"
                        )
                      }
                      className="px-3 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-md text-sm flex items-center justify-center gap-1"
                      disabled={isLoading}
                    >
                      <FaPlay className="text-xs" /> Journey Completed
                    </button>
                    <button
                      onClick={() =>
                        simulateEvent("AgentBookingCompletedEventRequest")
                      }
                      className="px-3 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-md text-sm flex items-center justify-center gap-1"
                      disabled={isLoading}
                    >
                      <FaPlay className="text-xs" /> Completed
                    </button>
                    <button
                      onClick={() =>
                        simulateEvent("AgentBookingCancelledEventRequest")
                      }
                      className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-md text-sm flex items-center justify-center gap-1"
                      disabled={isLoading}
                    >
                      <FaPlay className="text-xs" /> Cancelled
                    </button>
                    <button
                      onClick={() =>
                        simulateEvent("AgentBookingFailedEventRequest")
                      }
                      className="px-3 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 rounded-md text-sm flex items-center justify-center gap-1"
                      disabled={isLoading}
                    >
                      <FaPlay className="text-xs" /> Failed
                    </button>
                  </div>
                  {error && (
                    <p className="mt-2 text-red-400 text-sm">{error}</p>
                  )}
                </div>
              )}

              {/* Event History Toggle */}
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="mt-4 flex items-center gap-2 px-4 py-2 rounded-md bg-gray-700/50 text-lightGray hover:bg-gray-700/70 transition-colors"
              >
                <FaHistory />{" "}
                {showHistory ? "Hide Event History" : "Show Event History"}
              </button>

              {/* Event History */}
              {showHistory && (
                <div className="mt-4 max-h-60 overflow-y-auto border border-gray-700 rounded-md">
                  {eventHistory.length === 0 ? (
                    <p className="p-4 text-lightGray">No events recorded yet</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead className="bg-dark/50 text-lightGray">
                        <tr>
                          <th className="p-2 text-left">Time</th>
                          <th className="p-2 text-left">Event</th>
                        </tr>
                      </thead>
                      <tbody>
                        {eventHistory.map((event, index) => (
                          <tr
                            key={index}
                            className="border-t border-gray-700 hover:bg-dark/30"
                          >
                            <td className="p-2 text-lightGray">
                              {formatEventTime(event.timestamp)}
                            </td>
                            <td className="p-2 text-white">
                              {event.eventType}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </motion.div>

            {/* Ride Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="glass-effect rounded-xl p-6 mb-8"
            >
              <h2 className="text-2xl font-bold text-white mb-6">
                Ride Details
              </h2>

              <div className="grid md:grid-cols-2 gap-y-8 gap-x-12">
                {/* Pickup & Destination */}
                <div className="space-y-6">
                  <div className="flex items-start">
                    <div className="mt-1 mr-4 w-10 h-10 flex-shrink-0 bg-green-500/20 flex items-center justify-center rounded-full">
                      <FaMapMarkerAlt className="text-green-500" />
                    </div>
                    <div>
                      <p className="text-lightGray font-medium">
                        Pickup Location
                      </p>
                      <p className="text-white text-lg">
                        {booking.pickupLocation?.address ||
                          quote.pickupAddress ||
                          "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="mt-1 mr-4 w-10 h-10 flex-shrink-0 bg-red-500/20 flex items-center justify-center rounded-full">
                      <FaMapMarkerAlt className="text-red-500" />
                    </div>
                    <div>
                      <p className="text-lightGray font-medium">Destination</p>
                      <p className="text-white text-lg">
                        {booking.dropoffLocation?.address ||
                          quote.dropoffAddress ||
                          "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Date and Time */}
                <div className="space-y-6">
                  <div className="flex items-start">
                    <div className="mt-1 mr-4 w-10 h-10 flex-shrink-0 bg-blue-500/20 flex items-center justify-center rounded-full">
                      <FaCalendarAlt className="text-blue-500" />
                    </div>
                    <div>
                      <p className="text-lightGray font-medium">Date</p>
                      <p className="text-white text-lg">
                        {formatDate(booking.pickupTime || quote.pickupTime)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="mt-1 mr-4 w-10 h-10 flex-shrink-0 bg-yellow-500/20 flex items-center justify-center rounded-full">
                      <FaClock className="text-yellow-500" />
                    </div>
                    <div>
                      <p className="text-lightGray font-medium">Time</p>
                      <p className="text-white text-lg">
                        {formatTime(booking.pickupTime || quote.pickupTime)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Vehicle & Payment Details */}
            <div className="grid md:grid-cols-2 gap-8">
              {/* Vehicle Information */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="glass-effect rounded-xl p-6"
              >
                <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                  <FaCarSide className="text-primary mr-3" />
                  Vehicle Information
                </h3>

                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                    <span className="text-lightGray">Vehicle Type</span>
                    <span className="text-white font-medium">
                      {quote.vehicleType || "Standard"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                    <span className="text-lightGray">Vehicle Model</span>
                    <span className="text-white font-medium">
                      {quote.vehicleModel || "N/A"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                    <span className="text-lightGray">Driver</span>
                    <span className="text-white font-medium">
                      {driverDetails?.name ||
                        quote.driverName ||
                        "Assigned Driver"}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-lightGray">Passengers</span>
                    <span className="text-white font-medium">
                      {booking.passengers || quote.passengers || 1}
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Payment Information */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="glass-effect rounded-xl p-6"
              >
                <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                  <FaCreditCard className="text-primary mr-3" />
                  Payment Information
                </h3>

                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                    <span className="text-lightGray">Fare</span>
                    <span className="text-white font-medium">
                      ${quote.price?.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                    <span className="text-lightGray">Payment Method</span>
                    <span className="text-white font-medium">
                      {paymentData?.paymentMethod || "Credit Card"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                    <span className="text-lightGray">Payment Status</span>
                    <span className="text-green-400 font-medium">Paid</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-lightGray">Transaction ID</span>
                    <span className="text-white font-medium font-mono text-sm">
                      {paymentData?.transactionId ||
                        paymentIntent?.id ||
                        "TX" +
                          Math.random()
                            .toString(36)
                            .substring(2, 10)
                            .toUpperCase()}
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-8 flex flex-col sm:flex-row gap-4 justify-center"
            >
              <button
                onClick={() => navigate("/")}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-md text-white font-semibold transition-colors"
              >
                Return Home
              </button>
              <button
                onClick={() => navigate("/rides/history")}
                className="px-6 py-3 bg-primary hover:bg-primary-dark rounded-md text-white font-semibold transition-colors"
              >
                View Ride History
              </button>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PaymentSuccess;
