import { motion } from "framer-motion";
import { useDispatch } from "react-redux";
import { setUserLocation } from "../store/bookingSlice";
import BookingForm from "./BookingForm";

function Hero() {
  const dispatch = useDispatch();

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

  return (
    <div className="min-h-screen bg-hero-pattern bg-cover bg-center relative">
      <div className="absolute inset-0 bg-gradient-to-b from-dark/50 to-dark/80" />
      <div className="container mx-auto px-4 relative z-10 pt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Book Your Ride Instantly
            <span className="block text-2xl md:text-3xl mt-2 text-primary">
              Fast, Reliable & Affordable
            </span>
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="w-full px-2 sm:px-4 p-4 md:p-6">
            <div className="max-w-4xl mx-auto">
              <BookingForm onGetLocation={handleGetLocation} />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default Hero;
