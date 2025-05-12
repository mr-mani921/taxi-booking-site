import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { motion } from "framer-motion";
import { FaStar } from "react-icons/fa";
import { setSelectedQuote } from "../store/quoteSlice";

function Quotes() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { quotes, selectedQuote } = useSelector((state) => state.quote);

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

  console.log("the quotes are", quotes);

  const handleQuoteSelect = async (quote) => {
    try {
      // Save the selected quote in Redux
      dispatch(setSelectedQuote(quote));

      // Set loading state for availability check

      // Extract the bid reference from the quote
      const bidReference = quote.bidReference || quotes[0]?.bidReference;
      console.log("bidReference", bidReference);
      console.log("vendor id", quote.vendorId);

      if (!bidReference) {
        console.error("Couldn't find bid reference for this ride");
        return;
      }

      console.log("before updating selected bid is ", selectedQuote);

      // Check ride availability using the thunk
      // const resultAction = await dispatch(
      //   checkBidAvailability({
      //     bidReference,
      //     vendorId: quote.vendorId,
      //   })
      // );

      // if (checkBidAvailability.fulfilled.match(resultAction)) {
      //   // Availability check was successful
      //   const availabilityReference =
      //   resultAction.payload.availabilityReference;

      //   setCheckingAvailability(false);
      //   // Add availability reference to the selected quote
      //   dispatch(
      //     setSelectedQuote({
      //       ...quote,
      //       availabilityReference: availabilityReference,
      //     })
      //   );

      console.log("after updating selected quote is ", selectedQuote);

      navigate("/payment");

      // } else {
      //   // Handle error
      //   const errorMessage =
      //     resultAction.payload?.message ||
      //     "This ride is no longer available. Please try another option.";
      //   console.log("errorMessage", errorMessage);
      // }
    } catch (error) {
      console.error("Error checking ride availability:", error);
    }
  };

  return (
    <div className="min-h-screen bg-dark pt-20">
      {/* Hero Section */}
      <section className="relative py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-dark/50" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Available Rides
            </h1>
            <p className="text-lg text-lightGray">
              Choose from our selection of trusted drivers
            </p>
          </motion.div>
        </div>
      </section>

      {/* Quotes Section */}
      <section className="py-16 bg-charcoal">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {quotes.map((quote, index) => (
              <motion.div
                key={quote.id || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="glass-effect rounded-xl overflow-hidden group hover:border-primary border border-gray-700 transition-all duration-300"
              >
                {/* Driver Info */}
                <div className="p-6 border-b border-gray-700">
                  <div className="flex flex-col items-center gap-4">
                    <img
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                        quote.vendorName
                      )}&background=random`}
                      alt={quote.vendorName}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    <h3 className="text-xl font-semibold text-white">
                      {quote.vendorName}
                    </h3>

                    <div className="flex items-center gap-2 text-primary">
                      {Array.from({ length: 5 }, (_, i) => (
                        <div key={i}>
                          {i < getRatingValue(quote.rating) ? (
                            <FaStar className="text-primary" />
                          ) : (
                            <FaStar className="text-gray-500" />
                          )}
                        </div>
                      ))}
                      <span className="text-sm text-gray-400">
                        ({getRatingValue(quote.rating) || 0})
                      </span>
                    </div>

                    <span>{quote.vehicleType}</span>

                    <span>
                      {quote.etaInMinutes
                        ? new Date(
                            Date.now() + quote.etaInMinutes * 60000
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Unknown"}
                    </span>

                    <span>
                      {quote.displayPrice ||
                        `£${parseFloat(
                          quote.pricing?.price || quote.price
                        ).toFixed(2)}`}
                    </span>

                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                      Card Payment
                    </span>
                  </div>

                  {/* Select Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleQuoteSelect(quote)}
                    className="w-full bg-primary text-dark font-semibold py-3 rounded-lg mt-6 hover:shadow-glow transition-all duration-300"
                  >
                    Select This Ride
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default Quotes;
