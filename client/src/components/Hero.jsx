import { motion } from "framer-motion";
import { useDispatch } from "react-redux";
import { FaCheck } from "react-icons/fa";
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

  const benefits = [
    "Free cancellations",
    "Fully licensed providers",
    "Free wait time included",
    "Luggage items & Multi-stops",
  ];

  return (
    <div className="relative min-h-[90vh] overflow-hidden">
      {/* Hero Background */}
      <div className="absolute inset-0 w-full h-full z-0">
        <img
          src="https://images.unsplash.com/photo-1464219789935-c2d9d9aba644?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80"
          alt="Professional taxi service"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/30"></div>
      </div>

      {/* Hero Content */}
      <div className="container mx-auto px-4 md:px-8 relative z-10 pt-24 pb-20 min-h-[90vh] flex flex-col justify-center">
        {/* Marketing Copy - Centered */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mx-auto max-w-2xl mb-12"
        >
          <span className="inline-block px-4 py-1.5 bg-primary/20 text-white rounded-full text-sm font-medium mb-6 animate-pulse-subtle">
            #1 Trusted Taxi Service
          </span>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Pre-Book Taxis{" "}
            <span className="text-minicabit-accent3">Online</span>
          </h1>

          <p className="text-lg md:text-xl mb-8 text-gray-100">
            We check over{" "}
            <span className="font-bold text-white">1,000 taxi providers</span>{" "}
            so you don&apos;t have to. Trusted by{" "}
            <span className="font-bold text-white">millions of travellers</span>{" "}
            across the UK.
          </p>
        </motion.div>

        {/* Booking Form - Horizontal Below Headings */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="w-full mx-auto"
        >
          <div className="glass-effect rounded-2xl shadow-xl border border-white/20 p-6 md:p-8">
            <BookingForm onGetLocation={handleGetLocation} pageIs={"home"} />
          </div>
        </motion.div>
        <div className="grid grid-cols-2 gap-4 mt-20 max-w-lg mx-auto">
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 * index }}
              className="flex items-start space-x-3"
            >
              <div className="rounded-full bg-minicabit-accent3 p-1 mt-1 flex-shrink-0">
                <FaCheck className="text-primary w-3 h-3" />
              </div>
              <p className="text-gray-100 text-left">{benefit}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Hero;
