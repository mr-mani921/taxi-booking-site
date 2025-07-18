import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import {
  FaMapMarkerAlt,
  FaArrowRight,
  FaRegCalendarAlt,
  FaUsers,
  FaSuitcase,
  FaCheck,
} from "react-icons/fa";
import { format } from "date-fns";

function RideConfirmation() {
  const { selectedQuote } = useSelector((state) => state.quote);
  const { bookingData } = useSelector((state) => state.booking);
  const { latestRide } = useSelector((state) => state.booking);

  // Use the latest ride data if available, otherwise use booking data
  const ride = latestRide || {};
  const pickupLocation =
    ride.pickupLocation || bookingData?.pickupLocation || {};
  const dropoffLocation =
    ride.dropoffLocation || bookingData?.dropoffLocation || {};
  const pickupTime = ride.pickupTime || bookingData?.pickupTime;
  const passengers = ride.passengers || bookingData?.passengers || 1;
  const luggage = ride.luggage || bookingData?.luggage || 0;
  const fare = ride.fare || selectedQuote?.fare || "N/A";
  const driverName =
    ride.driverName || selectedQuote?.driverName || "Your driver";
  const vendorName =
    ride.vendorName || selectedQuote?.vendorName || "Taxi Service";
  const vehicleType =
    ride.vehicleType || selectedQuote?.vehicleType || "Standard";

  // Format date and time for display
  let formattedDate = "Not available";
  let formattedTime = "Not available";

  if (pickupTime) {
    try {
      const dateObj = new Date(pickupTime);
      formattedDate = format(dateObj, "EEE, MMM d, yyyy");
      formattedTime = format(dateObj, "h:mm a");
    } catch (error) {
      console.error("Error formatting date:", error);
    }
  }

  // Format fare for display
  const formattedFare =
    typeof fare === "number"
      ? new Intl.NumberFormat("en-GB", {
          style: "currency",
          currency: "GBP",
        }).format(fare)
      : fare;

  return (
    <div className="w-full max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-primary bg-opacity-10 p-6 border-b border-primary border-opacity-20">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800">
              Booking Confirmation
            </h2>
            <div className="flex items-center">
              <FaCheck className="text-green-500 mr-2" />
              <span className="text-green-600 font-medium">
                Booking Complete
              </span>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Ride Details Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Ride Details
            </h3>

            <div className="flex flex-col space-y-6">
              {/* Locations */}
              <div className="flex items-start">
                <div className="flex flex-col items-center mr-4">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
                    <FaMapMarkerAlt />
                  </div>
                  <div className="h-16 w-0.5 bg-gray-300 my-1"></div>
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
                    <FaMapMarkerAlt />
                  </div>
                </div>

                <div className="flex-1">
                  <div className="mb-6">
                    <p className="text-sm text-gray-500">From</p>
                    <p className="font-medium text-gray-800">
                      {pickupLocation.address}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">To</p>
                    <p className="font-medium text-gray-800">
                      {dropoffLocation.address}
                    </p>
                  </div>
                </div>
              </div>

              {/* Date, Time and Passengers */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-gray-200">
                <div className="flex items-start">
                  <FaRegCalendarAlt className="text-primary mt-1 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Date & Time</p>
                    <p className="font-medium text-gray-800">
                      {formattedDate} at {formattedTime}
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <FaUsers className="text-primary mt-1 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Passengers</p>
                    <p className="font-medium text-gray-800">
                      {passengers} passenger{passengers !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <FaSuitcase className="text-primary mt-1 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Luggage</p>
                    <p className="font-medium text-gray-800">
                      {luggage} item{luggage !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Service Details */}
          <div className="mb-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Service Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-500">Cab Provider</p>
                <p className="font-medium text-gray-800">{vendorName}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Vehicle</p>
                <p className="font-medium text-gray-800">{vehicleType}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Fixed Price</p>
                <p className="font-medium text-gray-800">{formattedFare}</p>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="bg-gray-50 p-4 rounded-md text-sm text-gray-600">
            <p>
              Your ride confirmation has been sent to your email address. You
              can also access this booking in your account under "My Rides".
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default RideConfirmation;
