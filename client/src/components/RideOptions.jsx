import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import minicabitGirl from "../assets/minicabit-girl.webp";

function RideOptions() {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center gap-8">
          {/* Image Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full lg:w-1/2"
          >
            <img
              src={minicabitGirl}
              alt="Woman in taxi"
              className="rounded-lg shadow-md w-full h-auto"
            />
          </motion.div>

          {/* Content Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full lg:w-1/2"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">
              Pre-Book Taxis Online - Cheap Zappy Taxis Quotes
            </h2>

            <div className="space-y-4 text-gray-700">
              <p>
                Compare fares from over 1,000 taxi firms nationwide in over 550
                towns and cities and save money on your next trip!
              </p>

              <p>
                Get quotes from licensed providers with a range of Standard and
                Executive taxis & minicabs available including Electric cars.
              </p>

              <p>
                Whether you are travelling long distances by private taxi or are
                looking for budget-friendly transport around your city, our
                listings offer a range of options, including 7-seater taxis.
              </p>

              <p>
                Compare online with zappy taxis for easy, cheap taxis fares and
                book a taxi today.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default RideOptions;
