import { motion } from "framer-motion";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setSelectedQuote, setSelectedVehicleType } from "../store/quoteSlice";
import { setBookingStep } from "../store/bookingSlice";

function QuoteSelection() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const quotes = useSelector((state) => state.quote.quotes);
  const selectedQuote = useSelector((state) => state.quote.selectedQuote);
  const vehicleTypes = useSelector((state) => state.quote.vehicleTypes);
  const bookingData = useSelector((state) => state.booking.bookingData);

  const handleQuoteSelect = (quote) => {
    dispatch(setSelectedQuote(quote));
    dispatch(setSelectedVehicleType(quote.vehicleType));
  };

  const handleContinue = () => {
    if (selectedQuote) {
      dispatch(setBookingStep(3));
      navigate("/payment");
    }
  };

  return (
    <div className="space-y-6 p-6 glass-effect rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold text-white mb-6">Select Your Ride</h2>

      {/* Booking Summary */}
      <div className="bg-dark/30 p-4 rounded-lg mb-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Booking Summary
        </h3>
        <div className="grid grid-cols-2 gap-4 text-white">
          <div>
            <p className="text-gray-400">Pickup Location</p>
            <p>
              {bookingData.pickupLocation
                ? `${bookingData.pickupLocation.lat.toFixed(
                    4
                  )}, ${bookingData.pickupLocation.lng.toFixed(4)}`
                : "Not selected"}
            </p>
          </div>
          <div>
            <p className="text-gray-400">Dropoff Location</p>
            <p>{bookingData.dropoffLocation || "Not selected"}</p>
          </div>
          <div>
            <p className="text-gray-400">Pickup Time</p>
            <p>{bookingData.pickupTime || "Not selected"}</p>
          </div>
          <div>
            <p className="text-gray-400">Passengers</p>
            <p>{bookingData.passengers}</p>
          </div>
        </div>
      </div>

      {/* Vehicle Options */}
      <div className="space-y-4">
        {vehicleTypes.map((vehicle) => (
          <motion.div
            key={vehicle.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`p-4 rounded-lg cursor-pointer transition-all ${
              selectedQuote?.vehicleType.id === vehicle.id
                ? "bg-primary/20 border-2 border-primary"
                : "bg-dark/30 border-2 border-transparent hover:border-primary/50"
            }`}
            onClick={() =>
              handleQuoteSelect({
                vehicleType: vehicle,
                price: quotes.find((q) => q.vehicleType.id === vehicle.id)
                  ?.price,
              })
            }
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-2xl">{vehicle.icon}</span>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {vehicle.name}
                  </h3>
                  <p className="text-gray-400">{vehicle.description}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-white">
                  $
                  {quotes.find((q) => q.vehicleType.id === vehicle.id)?.price ||
                    "---"}
                </p>
                <p className="text-sm text-gray-400">per ride</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Continue Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleContinue}
        disabled={!selectedQuote}
        className={`w-full bg-primary text-dark font-semibold py-3 rounded-lg hover-glow ${
          !selectedQuote ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        Continue to Payment
      </motion.button>
    </div>
  );
}

export default QuoteSelection;
