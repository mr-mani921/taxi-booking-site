import { useEffect } from "react";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import { FaCheckCircle, FaClock, FaMapMarkerAlt, FaCar } from "react-icons/fa";

function RideConfirmation() {
  const currentBooking = useSelector((state) => state.booking.currentBooking);
  const selectedQuote = useSelector((state) => state.quote.selectedQuote);

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
  }, []);

  if (!currentBooking || !selectedQuote) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl mx-auto"
      >
        {/* Success Message */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="inline-block"
          >
            <FaCheckCircle className="text-primary text-6xl mb-4" />
          </motion.div>
          <h1 className="text-3xl font-bold text-white mb-4">
            Booking Confirmed!
          </h1>
          <p className="text-lightGray">
            Your ride has been successfully booked. Here are your booking
            details.
          </p>
        </div>

        {/* Booking Details */}
        <div className="space-y-6">
          {/* Booking Reference */}
          <div className="bg-dark/30 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-2">
              Booking Reference
            </h3>
            <p className="text-primary font-mono">{currentBooking.id}</p>
          </div>

          {/* Ride Details */}
          <div className="bg-dark/30 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-4">
              Ride Details
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <FaMapMarkerAlt className="text-primary text-xl" />
                <div>
                  <p className="text-lightGray">Pickup Location</p>
                  <p className="text-white">
                    {currentBooking.pickupLocation
                      ? `${currentBooking.pickupLocation.lat.toFixed(
                          4
                        )}, ${currentBooking.pickupLocation.lng.toFixed(4)}`
                      : "Not specified"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <FaMapMarkerAlt className="text-primary text-xl" />
                <div>
                  <p className="text-lightGray">Dropoff Location</p>
                  <p className="text-white">
                    {currentBooking.dropoffLocation || "Not specified"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <FaClock className="text-primary text-xl" />
                <div>
                  <p className="text-lightGray">Pickup Time</p>
                  <p className="text-white">
                    {new Date(currentBooking.pickupTime).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <FaCar className="text-primary text-xl" />
                <div>
                  <p className="text-lightGray">Vehicle Type</p>
                  <p className="text-white">{selectedQuote.vehicleType.name}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="bg-dark/30 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-4">
              Payment Summary
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-lightGray">
                <span>Base Fare</span>
                <span>${selectedQuote.price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lightGray">
                <span>Platform Fee</span>
                <span>${(selectedQuote.price * 0.25).toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-600 pt-2 mt-2">
                <div className="flex justify-between text-white font-semibold">
                  <span>Total Amount</span>
                  <span>${(selectedQuote.price * 1.25).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-dark/30 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-4">
              Next Steps
            </h3>
            <div className="space-y-4">
              <p className="text-lightGray">
                You will receive a confirmation email with these details
                shortly.
              </p>
              <p className="text-lightGray">
                Your driver will contact you when they are on their way to pick
                you up.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default RideConfirmation;
