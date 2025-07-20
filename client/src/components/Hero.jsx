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
    <div className="relative overflow-hidden">
      {/* Hero Background */}
      <div className="absolute top-10 left-0 w-full z-0 h-[350px] md:h-full">
        <img
          src="https://www.minicabit.com/wp-content/themes/minicabit/assets/ac52a27e72def823d982.webp"
          alt="Professional taxi service"
          className="w-full h-full object-contain md:object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-black/10 to-black/10"></div>
      </div>

      {/* Hero Content */}
      <div className="  md:px-8 relative z-10 pt-24 pb-20 min-h-[50vh] flex flex-col justify-center">
        {/* Marketing Copy - Centered */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="px-4 text-center mx-auto max-w-2xl mb-12"
        >
          <span className="inline-block px-4 py-1.5 bg-primary/20 text-white rounded-full text-sm font-medium mb-6 animate-pulse-subtle">
            #1 Trusted Taxi Service
          </span>

          <h1 className="text-2xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Pre-Book Taxis{" "}
            <span className="text-minicabit-accent3">Online</span>
          </h1>

          <p className="text-md md:text-xl mb-8 text-gray-100">
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
          className="w-full max-w-full mx-auto rounded-2xl -mt-12 md:mt-0"
        >
          <div className=" rounded-2xl shadow-xl border border-white/20 p-6 md:p-8 relative z-10 backdrop-blur-sm bg-[#EDF2F7]">
            <BookingForm onGetLocation={handleGetLocation} pageIs={"home"} />
          </div>
        </motion.div>

        {/* Benefits */}
        <div className="px-4 grid grid-cols-2 gap-4 mt-20 max-w-lg mx-auto ">
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
              <p className="text-black md:text-gray-100 text-left">{benefit}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Hero;
