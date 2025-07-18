import { motion } from "framer-motion";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setSelectedQuote, setSelectedVehicleType } from "../store/quoteSlice";
import { setBookingStep } from "../store/bookingSlice";
import {
  FaCar,
  FaUsers,
  FaSuitcase,
  FaLeaf,
  FaCrown,
  FaStar,
} from "react-icons/fa";

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

  // Get vehicle icon based on type
  const getVehicleIcon = (vehicleType) => {
    if (!vehicleType) return <FaCar className="text-primary text-3xl" />;

    const type = vehicleType.toLowerCase();
    if (type.includes("executive") || type.includes("luxury")) {
      return <FaCrown className="text-primary text-3xl" />;
    } else if (type.includes("eco") || type.includes("electric")) {
      return <FaLeaf className="text-primary text-3xl" />;
    } else if (type.includes("mpv") || type.includes("minivan")) {
      return <FaUsers className="text-primary text-3xl" />;
    }
    return <FaCar className="text-primary text-3xl" />;
  };

  // Get vehicle image based on type
  const getVehicleImage = (vehicleType) => {
    if (!vehicleType) return "https://via.placeholder.com/120x80?text=Standard";

    const type = vehicleType.toLowerCase();
    if (type.includes("executive") || type.includes("luxury")) {
      return "https://via.placeholder.com/120x80?text=Executive";
    } else if (type.includes("eco") || type.includes("electric")) {
      return "https://via.placeholder.com/120x80?text=Eco";
    } else if (type.includes("mpv") || type.includes("minivan")) {
      return "https://via.placeholder.com/120x80?text=MPV";
    }
    return "https://via.placeholder.com/120x80?text=Standard";
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(amount);
  };

  return (
    <div className="space-y-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Select Your Vehicle
      </h2>

      {/* Vehicle Types */}
      <div className="grid grid-cols-1 gap-4">
        {quotes.map((quote, index) => (
          <motion.div
            key={quote.id || index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className={`border rounded-lg p-5 cursor-pointer transition-all duration-300 ${
              selectedQuote?.id === quote.id
                ? "border-primary bg-primary/5"
                : "border-gray-200 hover:border-primary/50"
            }`}
            onClick={() => handleQuoteSelect(quote)}
          >
            <div className="flex items-start">
              <div className="mr-4 flex-shrink-0">
                <img
                  src={getVehicleImage(quote.vehicleType)}
                  alt={quote.vehicleType || "Vehicle"}
                  className="w-24 h-16 object-cover rounded"
                />
              </div>

              <div className="flex-grow">
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-800">
                      {quote.vehicleType || "Standard Vehicle"}
                    </h3>

                    <div className="flex items-center mt-1">
                      <div className="flex mr-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <FaStar
                            key={star}
                            className={`w-3 h-3 ${
                              star <= (quote.rating || 4)
                                ? "text-primary"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-500">
                        {quote.vendorName}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xl font-bold text-gray-800">
                      {formatCurrency(quote.price || quote.fare || 0)}
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                  <div className="flex items-center">
                    <FaUsers className="mr-1" /> Up to{" "}
                    {quote.maxPassengers || 4} passengers
                  </div>
                  <div className="flex items-center">
                    <FaSuitcase className="mr-1" /> {quote.maxLuggage || 2}{" "}
                    luggage
                  </div>
                </div>

                {quote.features && (
                  <div className="mt-2 text-sm text-gray-600">
                    {quote.features.join(" • ")}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Continue Button */}
      <div className="pt-4 border-t border-gray-200">
        <button
          className={`w-full py-3 rounded-md font-medium ${
            selectedQuote
              ? "bg-primary text-white hover:bg-primary/90"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          } transition-colors`}
          onClick={handleContinue}
          disabled={!selectedQuote}
        >
          Continue to Payment
        </button>
      </div>
    </div>
  );
}

export default QuoteSelection;
