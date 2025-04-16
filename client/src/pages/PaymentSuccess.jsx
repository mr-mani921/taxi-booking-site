import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { motion } from "framer-motion";
import { resetPayment } from "../store/quoteSlice";
import {
  FaCarSide,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaClock,
  FaUsers,
  FaSuitcase,
  FaCheckCircle,
  FaCreditCard,
  FaReceipt,
} from "react-icons/fa";

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

  // Generate reference number
  const bookingReference =
    paymentData?.bookingReference ||
    location.state?.bookingReference ||
    `BK-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

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

            {/* Ride Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
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
                      {quote.driverName || "Assigned Driver"}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <div>
                      <span className="text-lightGray">Passengers</span>
                      <div className="flex items-center mt-1">
                        <FaUsers className="text-primary mr-2" />
                        <span className="text-white">
                          {booking.passengers || 1}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-lightGray">Luggage</span>
                      <div className="flex items-center mt-1">
                        <FaSuitcase className="text-primary mr-2" />
                        <span className="text-white">
                          {booking.luggage || 0}
                        </span>
                      </div>
                    </div>
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
                  <FaReceipt className="text-primary mr-3" />
                  Payment Information
                </h3>

                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                    <span className="text-lightGray">Payment Method</span>
                    <div className="flex items-center">
                      <FaCreditCard className="text-primary mr-2" />
                      <span className="text-white font-medium">
                        Credit Card
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                    <span className="text-lightGray">Base Fare</span>
                    <span className="text-white font-medium">
                      ${Number(quote.price || 0).toFixed(2)}
                    </span>
                  </div>

                  {quote.tax > 0 && (
                    <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                      <span className="text-lightGray">Tax</span>
                      <span className="text-white font-medium">
                        ${Number(quote.tax || 0).toFixed(2)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                    <span className="text-lightGray">Processing Fee</span>
                    <span className="text-white font-medium">
                      ${Number(quote.processingFee || 0).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <span className="text-white font-bold">Total</span>
                    <span className="text-primary text-xl font-bold">
                      ${Number(quote.price || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Additional Notes */}
            {booking.specialRequests && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="mt-8 glass-effect rounded-xl p-6"
              >
                <h3 className="text-xl font-bold text-white mb-2">
                  Special Instructions
                </h3>
                <p className="text-lightGray">{booking.specialRequests}</p>
              </motion.div>
            )}

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-10 flex flex-wrap justify-center gap-4"
            >
              <button
                onClick={() => navigate("/")}
                className="px-6 py-3 bg-dark-lighter hover:bg-dark-lightest rounded-md text-white transition-colors"
              >
                Return Home
              </button>

              <button
                onClick={() => navigate("/ride-history")}
                className="px-6 py-3 bg-primary hover:bg-primary-dark rounded-md text-white transition-colors"
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
