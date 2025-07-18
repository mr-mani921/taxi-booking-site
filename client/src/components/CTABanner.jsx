import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FaApple, FaGooglePlay, FaMobile } from "react-icons/fa";

function CTABanner() {
  return (
    <section className="py-16 bg-primary/10">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row items-center justify-between gap-8"
        >
          <div className="md:w-1/2">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Book on the move with the MiniCab app!
            </h2>

            <p className="text-lg text-gray-600 mb-8 max-w-xl">
              Booking a taxi should be easy, quick and simple. In today's
              digital world, it only makes sense to make it easier to book
              taxis. Forget carrying cash or looking for taxi numbers, just
              download the app to compare taxi fares and book your next ride!
            </p>

            <ul className="space-y-3 mb-8">
              <li className="flex items-start">
                <span className="text-primary font-bold mr-2">•</span>
                <span className="text-gray-700">
                  Faster way to compare prices & book
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-primary font-bold mr-2">•</span>
                <span className="text-gray-700">
                  Pay by Apple Pay and Google Pay
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-primary font-bold mr-2">•</span>
                <span className="text-gray-700">
                  Easily manage your bookings
                </span>
              </li>
            </ul>

            <div className="flex flex-wrap gap-4">
              <a
                href="#"
                className="flex items-center bg-black text-white px-6 py-3 rounded-md hover:bg-gray-800 transition-colors"
              >
                <FaApple className="text-2xl mr-2" />
                <div className="flex flex-col">
                  <span className="text-xs">Download on the</span>
                  <span className="font-semibold">App Store</span>
                </div>
              </a>

              <a
                href="#"
                className="flex items-center bg-black text-white px-6 py-3 rounded-md hover:bg-gray-800 transition-colors"
              >
                <FaGooglePlay className="text-2xl mr-2" />
                <div className="flex flex-col">
                  <span className="text-xs">GET IT ON</span>
                  <span className="font-semibold">Google Play</span>
                </div>
              </a>
            </div>
          </div>

          <div className="md:w-1/3 flex justify-center">
            <div className="w-48 h-96 bg-gray-200 rounded-3xl relative overflow-hidden shadow-lg">
              <div className="absolute inset-1 bg-white rounded-2xl flex items-center justify-center">
                <div className="flex flex-col items-center">
                  <FaMobile className="text-6xl text-primary mb-4" />
                  <p className="text-gray-800 text-center text-sm font-medium">
                    Mobile App
                    <br />
                    Coming Soon
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default CTABanner;
