import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { motion } from "framer-motion";
import { resetPayment } from "../store/quoteSlice";
import {
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaClock,
  FaCheckCircle,
  FaCreditCard,
} from "react-icons/fa";
import RideTracking from "../components/RideTracking";

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

  // Generate reference number
  const bookingReference =
    selectedQuote?.bookingReference || paymentData?.bookingReference;
  const rideId = paymentData?.rideId;

  // Authorization reference for iGo
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
    };
  }, [selectedQuote, navigate, dispatch, location.state]);

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

  return (
    <div className="min-h-screen bg-white pt-20">
      {/* Hero Section */}
      <section className="relative py-12 overflow-hidden bg-gray-50">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-white/50" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600">
              <FaCheckCircle className="text-3xl" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
              Payment Successful!
            </h1>
            <p className="text-lg text-gray-600">
              Your ride has been booked and payment processed successfully
            </p>
          </motion.div>
        </div>
      </section>

      {/* Details Section */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              {/* Ride Status & Driver Info */}
              <div className="md:col-span-2">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                >
                  <RideTracking
                    rideId={rideId}
                    bookingReference={bookingReference}
                    authorizationReference={authorizationReference}
                  />
                </motion.div>
              </div>

              {/* Ride Details & Payment Info */}
              <div className="md:col-span-1">
                {/* Ride Details */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="bg-white rounded-xl p-6 mb-8 shadow-sm border border-gray-200"
                >
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">
                    Ride Details
                  </h2>

                  <div className="space-y-6">
                    <div>
                      <div className="flex items-start mb-2">
                        <FaMapMarkerAlt className="text-primary mt-1.5 mr-3" />
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800">
                            Pickup
                          </h3>
                          <p className="text-gray-600">
                            {booking?.pickupLocation?.address || "N/A"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <FaMapMarkerAlt className="text-primary mt-1.5 mr-3" />
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800">
                            Destination
                          </h3>
                          <p className="text-gray-600">
                            {booking?.dropoffLocation?.address || "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex items-start mb-4">
                        <FaCalendarAlt className="text-primary mt-1 mr-3" />
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800">
                            Date
                          </h3>
                          <p className="text-gray-600">
                            {formatDate(booking?.pickupTime)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <FaClock className="text-primary mt-1 mr-3" />
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800">
                            Time
                          </h3>
                          <p className="text-gray-600">
                            {formatTime(booking?.pickupTime)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Payment Details */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
                >
                  <div className="flex items-center mb-6">
                    <FaCreditCard className="text-2xl text-primary mr-3" />
                    <h2 className="text-2xl font-bold text-gray-800">
                      Payment
                    </h2>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                      <span className="text-gray-600">Fare</span>
                      <span className="text-gray-800 font-medium">
                        £
                        {quote?.pricing?.priceNET?.toFixed(2) ||
                          quote?.price?.toFixed(2) ||
                          "0.00"}
                      </span>
                    </div>

                    <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                      <span className="text-gray-600">Payment Method</span>
                      <span className="text-gray-800 font-medium">
                        {paymentData?.paymentMethod || "Credit Card"}
                      </span>
                    </div>

                    <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                      <span className="text-gray-600">Payment Status</span>
                      <span className="text-green-600 font-medium">Paid</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600">Transaction ID</span>
                      <span className="text-gray-800 font-medium font-mono text-sm truncate max-w-[150px]">
                        {paymentData?.paymentIntentId ||
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
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 rounded-md text-gray-700 font-semibold transition-colors"
              >
                Return Home
              </button>
              <button
                onClick={() => navigate("/ride-history")}
                className="px-6 py-3 bg-primary hover:bg-primary/90 rounded-md text-white font-semibold transition-colors"
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
