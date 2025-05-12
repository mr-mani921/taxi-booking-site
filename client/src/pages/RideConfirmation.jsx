import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { motion } from "framer-motion";
import { resetPayment } from "../store/quoteSlice";
import { fetchRideById } from "../store/thunks";
import { BsCheckCircleFill } from "react-icons/bs";
import {
  FaCarSide,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaClock,
  FaUsers,
  FaSuitcase,
} from "react-icons/fa";

const RideConfirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const [rideDetails, setRideDetails] = useState(null);
  const [localError, setLocalError] = useState(null);

  const selectedQuote = useSelector((state) => state.quote.selectedQuote);
  const paymentStatus = useSelector((state) => state.quote.paymentStatus);
  const loading = useSelector((state) => state.api.loading.rides);
  const error = useSelector((state) => state.api.errors.rides);

  // Get ride ID from URL query params or state
  const rideId =
    new URLSearchParams(location.search).get("rideId") ||
    (location.state && location.state.rideId);

  useEffect(() => {
    // Reset payment state when component unmounts
    return () => {
      dispatch(resetPayment());
    };
  }, [dispatch]);

  useEffect(() => {
    // If payment was not successful and no ride ID, redirect to home
    if (paymentStatus !== "success" && !rideId) {
      navigate("/");
      return;
    }

    if (rideId) {
      dispatch(fetchRideById(rideId))
        .unwrap()
        .then((data) => {
          setRideDetails(data);
        })
        .catch((err) => {
          console.error("Error fetching ride details:", err);
          setLocalError(
            "Failed to load ride details. Please check your bookings in the account section."
          );
        });
    } else if (selectedQuote) {
      // If no rideId but we have selectedQuote, use that for display
      setRideDetails({
        ...selectedQuote,
        status: "booked",
      });
    }
  }, [rideId, navigate, paymentStatus, selectedQuote, dispatch]);

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

  if (loading && !rideDetails) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || localError) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md">
          <p>{error || localError}</p>
          <button
            className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
            onClick={() => navigate("/")}
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto px-4 py-12"
    >
      <div className="max-w-3xl mx-auto bg-dark-lighter rounded-lg shadow-xl overflow-hidden">
        <div className="text-center p-8 bg-primary bg-opacity-10">
          <BsCheckCircleFill className="inline-block text-5xl text-primary mb-4" />
          <h1 className="text-3xl font-bold text-white">Booking Confirmed!</h1>
          <p className="text-gray-300 mt-2">
            Your ride has been successfully booked.
          </p>
          {rideDetails && rideDetails.bookingReference && (
            <p className="mt-2 bg-dark-lightest inline-block px-4 py-2 rounded-md text-white">
              Booking Reference:{" "}
              <span className="font-mono font-semibold">
                {rideDetails.bookingReference}
              </span>
            </p>
          )}
        </div>

        {rideDetails && (
          <div className="p-8">
            <h2 className="text-xl font-semibold text-white mb-6">
              Ride Details
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Pickup & Destination */}
              <div className="space-y-4">
                <div className="flex items-start">
                  <FaMapMarkerAlt className="text-green-500 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-gray-400 text-sm">Pickup Location</p>
                    <p className="text-white">
                      {rideDetails.pickupLocation?.address || "N/A"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <FaMapMarkerAlt className="text-red-500 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-gray-400 text-sm">Destination</p>
                    <p className="text-white">
                      {rideDetails.dropoffLocation?.address || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Date and Time */}
              <div className="space-y-4">
                <div className="flex items-start">
                  <FaCalendarAlt className="text-blue-400 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-gray-400 text-sm">Date</p>
                    <p className="text-white">
                      {formatDate(
                        rideDetails.scheduledAt || rideDetails.pickupTime
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <FaClock className="text-yellow-400 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-gray-400 text-sm">Time</p>
                    <p className="text-white">
                      {formatTime(
                        rideDetails.scheduledAt || rideDetails.pickupTime
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Vehicle & Payment Details */}
            <div className="mt-8 grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">
                  Vehicle Information
                </h3>
                <div className="bg-dark-lightest p-4 rounded-lg">
                  <div className="flex items-center mb-3">
                    <FaCarSide className="text-gray-400 mr-3" />
                    <div>
                      <p className="text-gray-300 text-sm">Vehicle Type</p>
                      <p className="text-white">
                        {rideDetails.vehicleType || "Standard"}
                      </p>
                    </div>
                  </div>

                  <div className="flex space-x-6">
                    <div className="flex items-center">
                      <FaUsers className="text-gray-400 mr-2" />
                      <span className="text-white">
                        {rideDetails.passengers || 1} Passengers
                      </span>
                    </div>

                    <div className="flex items-center">
                      <FaSuitcase className="text-gray-400 mr-2" />
                      <span className="text-white">
                        {rideDetails.luggage || 1} Luggage
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-3">
                  Payment Summary
                </h3>
                <div className="bg-dark-lightest p-4 rounded-lg">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-300">Base Fare</span>
                    <span className="text-white">
                      £
                      {rideDetails.fare?.baseFare ||
                        rideDetails.price ||
                        "0.00"}
                    </span>
                  </div>

                  {(rideDetails.fare?.taxes || rideDetails.tax) && (
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-300">Taxes & Fees</span>
                      <span className="text-white">
                        £{rideDetails.fare?.taxes || rideDetails.tax || "0.00"}
                      </span>
                    </div>
                  )}

                  <div className="border-t border-gray-600 my-2 pt-2 flex justify-between font-semibold">
                    <span className="text-white">Total</span>
                    <span className="text-primary">
                      £
                      {rideDetails.fare?.total ||
                        rideDetails.totalPrice ||
                        "0.00"}
                    </span>
                  </div>

                  <div className="mt-2 text-sm text-gray-400">
                    {rideDetails.prepaid ? "Pre-paid" : "Pay to driver"}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => navigate(`/ride/${rideId || "latest"}`)}
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex-1"
              >
                Track Your Ride
              </button>

              <button
                onClick={() => navigate("/")}
                className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors flex-1"
              >
                Return Home
              </button>
            </div>

            {/* Next Steps */}
            <div className="mt-8 p-4 bg-dark-lightest rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-3">
                What&apos;s Next?
              </h3>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start">
                  <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary text-white text-xs mr-3 flex-shrink-0">
                    1
                  </span>
                  <span>
                    You will receive a confirmation email and SMS with your
                    booking details.
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary text-white text-xs mr-3 flex-shrink-0">
                    2
                  </span>
                  <span>
                    Your driver will be assigned shortly before your scheduled
                    pickup time.
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary text-white text-xs mr-3 flex-shrink-0">
                    3
                  </span>
                  <span>
                    You can track your ride and contact your driver through the
                    app.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default RideConfirmation;
