import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { FaStar, FaCar, FaCarAlt, FaUsers } from "react-icons/fa";
import { setSelectedQuote } from "../store/quoteSlice";
import BookingForm from "../components/BookingForm";
import { setUserLocation } from "../store/bookingSlice";

function Quotes() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { quotes, selectedQuote } = useSelector((state) => state.quote);
  const { bookingData } = useSelector((state) => state.booking);
  const [formVisible, setFormVisible] = useState(false);

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        dispatch(
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        );
      });
    }
  };

  // Helper function to convert rating string to numeric value
  const getRatingValue = (rating) => {
    if (!rating) return 0;

    // Handle numeric ratings that might be stored as strings
    if (!isNaN(parseFloat(rating))) {
      return parseFloat(rating);
    }

    // Handle rating strings
    switch (rating) {
      case "FiveStars":
      case "FiveStar":
        return 5;
      case "FourStars":
      case "FourStar":
        return 4;
      case "ThreeStars":
      case "ThreeStar":
        return 3;
      case "TwoStars":
      case "TwoStar":
        return 2;
      case "OneStar":
        return 1;
      default:
        return 0;
    }
  };

  const handleQuoteSelect = async (quote) => {
    try {
      // Save the selected quote in Redux
      dispatch(setSelectedQuote(quote));

      // Navigate to payment page
      navigate("/payment");
    } catch (err) {
      console.error("Error selecting quote:", err);
    }
  };

  // Determine quote card icon based on vehicle type
  const getVehicleIcon = (vehicleType) => {
    if (!vehicleType) return <FaCar />;

    const type = vehicleType.toLowerCase();
    if (type.includes("executive") || type.includes("luxury")) {
      return <FaCarAlt />;
    } else if (type.includes("mpv") || type.includes("minivan")) {
      return <FaUsers />;
    }
    return <FaCar />;
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-lightBg pt-20">
      <div className="md:container md:mx-auto md:px-4 py-10">
        {/* Title Section */}
        <div className="container mx-auto px-4 mb-10 text-center md:text-left">
          <h1 className="text-2xl md:text-4xl font-bold text-gray-800 mb-2">
            Available Quotes
          </h1>
          <p className="text-gray-600">
            {bookingData?.pickupLocation?.address &&
            bookingData?.dropoffLocation?.address ? (
              <span>
                From{" "}
                <span className="font-medium">
                  {bookingData.pickupLocation.address}
                </span>{" "}
                to{" "}
                <span className="font-medium">
                  {bookingData.dropoffLocation.address}
                </span>
              </span>
            ) : (
              "Select the best option for your journey"
            )}
          </p>
        </div>

        {/* Mobile Toggle for Booking Form */}
        <div className="md:hidden mb-6">
          <button
            onClick={() => setFormVisible(!formVisible)}
            className="w-full py-3 bg-gray-100 rounded-md text-gray-700 font-medium border border-gray-300 flex justify-center items-center"
          >
            {formVisible ? "Hide Booking Form" : "Modify Search"}
          </button>

          {formVisible && (
            <div className="mt-4 p-4 bg-[#EDF2F7] rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Update your search
              </h3>
              <BookingForm onGetLocation={handleGetLocation} pageIs={"quote"} />
            </div>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Left Sidebar - Booking Form (Hidden on Mobile) */}
          <div className="hidden md:block md:w-1/3 lg:w-1/4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 sticky top-28">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Update your search
              </h3>
              <BookingForm onGetLocation={handleGetLocation} pageIs={"quote"} />
            </div>
          </div>

          {/* Right Section - Quotes List */}
          <div className="md:w-2/3 lg:w-3/4">
            {quotes.length === 0 ? (
              <div className="bg-white p-10 text-center rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-700 mb-4">
                  No quotes available
                </h3>
                <p className="text-gray-600 mb-6">
                  Try adjusting your search parameters or try again later.
                </p>
                <button
                  onClick={() => navigate("/booking")}
                  className="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary/90 transition-colors"
                >
                  Back to Search
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {quotes.map((quote, index) => (
                  <motion.div
                    key={quote.id || index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className={`bg-white rounded-lg overflow-hidden border transition-all duration-300 shadow-sm hover:shadow-md ${
                      selectedQuote?.id === quote.id
                        ? "border-primary"
                        : "border-gray-200"
                    }`}
                  >
                    <div className="p-6">
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-primary text-2xl">
                            {getVehicleIcon(quote.vehicleType)}
                          </div>

                          <div>
                            <h3 className="text-xl font-semibold text-gray-800">
                              {quote.vehicleType || "Standard Vehicle"}
                            </h3>

                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex">
                                {Array.from({ length: 5 }, (_, i) => (
                                  <div key={i}>
                                    {i < getRatingValue(quote.rating) ? (
                                      <FaStar className="text-primary text-sm" />
                                    ) : (
                                      <FaStar className="text-gray-300 text-sm" />
                                    )}
                                  </div>
                                ))}
                              </div>
                              <span className="text-sm text-gray-500">
                                {quote.vendorName || "Taxi Provider"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end">
                          <div className="text-2xl font-bold text-gray-800 mb-2">
                            {formatCurrency(quote.pricing.price || 0)}
                          </div>

                          <div className="flex items-center gap-2 mb-2">
                            <img src="/visa.svg" alt="Visa" className="h-6" />
                            <img
                              src="/mastercard.svg"
                              alt="Mastercard"
                              className="h-6"
                            />
                          </div>

                          <div className="text-xs text-gray-500 mb-2">
                            Cards only - Secure payment
                          </div>

                          <button
                            onClick={() => handleQuoteSelect(quote)}
                            className="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary/90 transition-colors flex items-center gap-2"
                          >
                            <span>Select & Pay</span>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* Vehicle features */}
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600">
                          <div>Up to {quote.maxPassengers || 4} passengers</div>
                          <div>Up to {quote.maxLuggage || 2} luggage</div>
                          {quote.features?.map((feature, i) => (
                            <div key={i}>{feature}</div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Quotes;
