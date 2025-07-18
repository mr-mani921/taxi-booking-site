import { motion } from "framer-motion";
import { useDispatch } from "react-redux";
import { FaCheck, FaLocationArrow } from "react-icons/fa";
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

          <div className="grid grid-cols-2 gap-4 mb-10 max-w-lg mx-auto">
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

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            onClick={handleGetLocation}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-white text-primary rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 font-medium"
          >
            <FaLocationArrow className="text-primary" />
            <span>Use My Location</span>
          </motion.button>
        </motion.div>

        {/* Booking Form - Horizontal Below Headings */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="w-full max-w-4xl mx-auto"
        >
          <div className="glass-effect rounded-2xl shadow-xl border border-white/20 p-6 md:p-8">
            <h2 className="text-2xl font-semibold text-minicabit-accent3 mb-6 text-center">
              Book Your Ride
            </h2>
            <BookingForm onGetLocation={handleGetLocation} pageIs={"home"} />
          </div>
        </motion.div>
      </div>

      {/* How it works section */}
      <div className="bg-white py-16">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              How it <span className="text-primary">Works</span>
            </h2>
            <div className="w-24 h-1 bg-primary/20 mx-auto rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: 1,
                title: "Pick your location and time",
                description:
                  "Enter your journey details and we&apos;ll search 1,000&apos;s of taxi providers to find you the best value.",
              },
              {
                step: 2,
                title: "Choose your ride",
                description:
                  "Select from a range of cars to suit your needs. All licensed, high quality drivers.",
              },
              {
                step: 3,
                title: "Pay securely",
                description:
                  "Pay for your fixed price ride securely through our website or app.",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="card group"
              >
                <div className="mb-4 flex justify-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg group-hover:bg-primary group-hover:text-white transition-all duration-300">
                    {item.step}
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3 text-center">
                  {item.title}
                </h3>
                <p className="text-gray-600 text-center">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Hero;
