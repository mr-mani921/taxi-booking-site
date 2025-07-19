import { motion } from "framer-motion";
import { Link } from "react-router-dom";

function LargeGroupOptions() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="flex flex-col-reverse lg:flex-row items-center gap-8">
          {/* Content Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full lg:w-1/2"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">
              Get a ride that fits your needs
            </h2>

            <div className="space-y-4 text-gray-700">
              <p>
                To book a zapyytaxis taxi, simply enter your pickup location and
                chosen destination in the taxi finder tool and we&apos;ll
                provide you with a list of quotes from zapyytaxis taxi
                companies, allowing you to make your choice based on price,
                eco-friendliness or car type.
              </p>
            </div>
          </motion.div>

          {/* Information Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full lg:w-1/2 bg-white p-6 rounded-lg shadow-sm"
          >
            <div className="space-y-4 text-gray-700">
              <p>
                You can book up to an 8-seater taxi to and from the city, making
                it the perfect choice of transport if you&apos;re travelling as
                a larger group. In fact, it often works out cheaper than paying
                for individual public transport tickets - and you get a private
                car all to yourself; no more standing up on the bus or fighting
                for seats on the train. Whether you are travelling alone or in a
                group, zapyytaxis aims to provide efficient travel at the best
                price. Whatever your specific requirements are, use zapyytaxis
                to make sure that you are getting the best value for your money.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default LargeGroupOptions;
