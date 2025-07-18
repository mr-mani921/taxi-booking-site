import { motion } from "framer-motion";
import { FaMapMarkerAlt, FaCar, FaStar } from "react-icons/fa";

const steps = [
  {
    icon: <FaMapMarkerAlt className="text-4xl text-primary" />,
    title: "Set Location",
    description:
      "Choose your pickup location and destination with our easy-to-use interface",
  },
  {
    icon: <FaCar className="text-4xl text-primary" />,
    title: "Select Ride",
    description:
      "Pick from our premium fleet of vehicles tailored to your needs",
  },
  {
    icon: <FaStar className="text-4xl text-primary" />,
    title: "Enjoy Ride",
    description: "Relax and enjoy your journey with our professional drivers",
  },
];

function HowItWorks() {
  return (
    <section className="py-20 bg-white relative overflow-hidden">
      <div className="container mx-auto px-4">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-16"
        >
          How It Works
        </motion.h2>

        <div className="relative">
          {/* Connecting Line */}
          <div className="hidden md:block absolute top-[45%] left-0 w-full h-0.5 bg-gradient-to-r from-primary/20 via-primary to-primary/20 transform -translate-y-1/2" />

          <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-12 md:gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="relative flex flex-col items-center text-center w-full md:w-1/3"
              >
                {/* Step Number */}
                <div className="absolute -top-6 text-4xl font-bold text-primary/20">
                  {index + 1}
                </div>

                {/* Icon Circle */}
                <div className="relative z-10 w-20 h-20 mb-4 rounded-full bg-gray-50 flex items-center justify-center shadow-sm border border-gray-200 group-hover:border-primary transition-colors duration-300">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="transform transition-transform duration-300"
                  >
                    {step.icon}
                  </motion.div>
                </div>

                <h3 className="text-xl font-semibold text-gray-800 pt-4 mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-600 max-w-xs">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;
