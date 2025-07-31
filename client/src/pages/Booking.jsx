import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { motion } from "framer-motion";
import { Navigate } from "react-router-dom";
import BookingForm from "../components/BookingForm";
import RideBenefits from "../components/RideBenefits";
import BookingTestimonials from "../components/BookingTestimonials";
import { resetBookingState, setUserLocation } from "../store/bookingSlice.js";
import { resetQuoteState } from "../store/quoteSlice.js";
import { getActiveRide } from "../store/thunks/bookingThunks";
import { FaMapMarkerAlt, FaCalendarAlt, FaClock } from "react-icons/fa";

function Booking() {
  const dispatch = useDispatch();
  const activeRide = useSelector((state) => state.booking.activeRide);
  const userLocation = useSelector((state) => state.booking.userLocation);

  useEffect(() => {
    // Reset states when component mounts
    dispatch(resetBookingState());
    dispatch(resetQuoteState());

    // Check for active ride
    dispatch(getActiveRide());
  }, [dispatch]);

  // Handle current location
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

  // Redirect to active ride details if one is in progress
  if (activeRide && activeRide.status !== "COMPLETED") {
    return <Navigate to={`/ride/${activeRide.id}`} replace />;
  }

  return (
    <div className="min-h-screen bg-white pt-20">
      {/* Hero Section */}
      <section className="bg-gray-50 py-12">
        <div className="md:container md:mx-auto md:px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="container mx-auto px-4"
            >
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">
                Book Your Taxi Online
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                Compare fares from over 1,000 taxi firms nationwide and save
                money on your next trip!
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex items-start space-x-4">
                  <div className="mt-1">
                    <FaMapMarkerAlt className="text-primary text-xl" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      UK-wide Service
                    </h3>
                    <p className="text-gray-600">
                      Available in over 550 towns and cities across the UK
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="mt-1">
                    <FaCalendarAlt className="text-primary text-xl" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      Advance Booking
                    </h3>
                    <p className="text-gray-600">
                      Book up to 12 months in advance
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="mt-1">
                    <FaClock className="text-primary text-xl" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      24/7 Support
                    </h3>
                    <p className="text-gray-600">
                      By email, live chat or phone, we're here to help
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="bg-[#EDF2F7] rounded-lg shadow-md border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Book a taxi
                </h2>
                <BookingForm
                  onGetLocation={handleGetLocation}
                  pageIs={"booking"}
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <RideBenefits />

      {/* Testimonials */}
      <BookingTestimonials />
    </div>
  );
}

export default Booking;
