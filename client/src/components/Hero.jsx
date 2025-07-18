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
    <div className="min-h-[90vh] bg-white relative pt-20">
      <div className="absolute inset-0 w-full h-full z-0">
        <img
          src="https://images.pond5.com/two-happy-women-going-vacation-footage-040413872_iconl.jpeg"
          alt="Happy women going on vacation"
          className="w-full h-full object-cover object-center"
          style={{ minHeight: "90vh" }}
        />
        <div className="absolute inset-0 bg-white bg-opacity-30"></div>
      </div>
      <div className="container mx-auto px-4 relative z-10 pt-10 pb-16">
        <div className="flex flex-col items-center">
          {/* Marketing Copy */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-2xl mb-8"
          >
            <h1 className="text-3xl md:text-5xl font-bold text-gray-800 mb-6">
              Pre-Book Taxis Online - Cheap Zappy Taxis Quotes
            </h1>

            <p className="text-lg md:text-xl mb-8 text-gray-700">
              We check over{" "}
              <span className="font-bold">1,000 taxi providers</span> so you
              don't have to. Trusted by{" "}
              <span className="font-bold">millions of travellers</span> across
              the UK.
            </p>

            <div className="grid grid-cols-2 gap-4 mb-10">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <FaCheck className="text-minicabit-green mt-1 flex-shrink-0" />
                  <p className="text-gray-700">{benefit}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Booking Form */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="w-full max-w-4xl"
          >
            <div className="bg-white rounded-lg shadow-minicabit border border-gray-200 p-5">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Book a taxi
              </h2>
              <BookingForm onGetLocation={handleGetLocation} pageIs={"home"} />
            </div>
          </motion.div>
        </div>
      </div>

      {/* How it works section */}
      <div className="bg-gray-50 py-10">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-8 text-center">
            How it works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
              <div className="mb-4 text-primary font-bold text-lg">1</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Pick your location and time
              </h3>
              <p className="text-gray-600">
                Enter your journey details and we'll search 1,000's of taxi
                providers to find you the best value.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
              <div className="mb-4 text-primary font-bold text-lg">2</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Choose your ride
              </h3>
              <p className="text-gray-600">
                Select from a range of cars to suit your needs. All licensed,
                high quality drivers.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
              <div className="mb-4 text-primary font-bold text-lg">3</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Pay securely
              </h3>
              <p className="text-gray-600">
                Pay for your fixed price ride securely through our website or
                app.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Hero;
