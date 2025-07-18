import { motion } from "framer-motion";
import {
  FaTaxi,
  FaPlane,
  FaSuitcase,
  FaUsers,
  FaClock,
  FaRoute,
} from "react-icons/fa";

const services = [
  {
    icon: <FaTaxi className="text-4xl text-primary" />,
    title: "City Rides",
    description: "Quick and comfortable rides within the city",
    features: [
      "Professional drivers",
      "Clean vehicles",
      "Air conditioning",
      "Multiple payment options",
    ],
  },
  {
    icon: <FaPlane className="text-4xl text-primary" />,
    title: "Airport Transfers",
    description: "Reliable airport pickup and drop-off service",
    features: [
      "Flight tracking",
      "Meet & greet",
      "Luggage assistance",
      "Fixed rates",
    ],
  },
  {
    icon: <FaSuitcase className="text-4xl text-primary" />,
    title: "Business Travel",
    description: "Corporate transportation solutions",
    features: [
      "Corporate accounts",
      "Priority booking",
      "Executive vehicles",
      "Billing options",
    ],
  },
  {
    icon: <FaUsers className="text-4xl text-primary" />,
    title: "Group Travel",
    description: "Comfortable rides for groups and events",
    features: [
      "Multiple vehicle sizes",
      "Event coordination",
      "Group discounts",
      "Flexible scheduling",
    ],
  },
];

const features = [
  {
    icon: <FaClock className="text-3xl text-primary" />,
    title: "24/7 Availability",
    description: "Round-the-clock service for your convenience",
  },
  {
    icon: <FaRoute className="text-3xl text-primary" />,
    title: "Route Optimization",
    description: "Smart routing for faster arrival times",
  },
];

function Services() {
  return (
    <div className="min-h-screen bg-white pt-20">
      {/* Hero Section */}
      <section className="relative py-16 overflow-hidden bg-gray-50">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-white/50" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
              Our Services
            </h1>
            <p className="text-lg text-gray-600">
              Premium transportation solutions tailored to your needs
            </p>
          </motion.div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {services.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white rounded-xl p-8 group hover:border-primary border border-gray-200 shadow-sm transition-all duration-300"
              >
                <div className="mb-6 transform group-hover:scale-110 transition-transform duration-300">
                  {service.icon}
                </div>
                <h3 className="text-2xl font-semibold text-gray-800 mb-4">
                  {service.title}
                </h3>
                <p className="text-gray-600 mb-6">{service.description}</p>
                <ul className="space-y-3">
                  {service.features.map((feature, i) => (
                    <li key={i} className="flex items-center text-gray-600">
                      <span className="text-primary mr-2">●</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Features */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl font-bold text-center text-gray-800 mb-12"
          >
            Additional Features
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white rounded-xl p-6 flex items-center gap-6 shadow-sm border border-gray-200"
              >
                <div className="flex-shrink-0">{feature.icon}</div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Ready to Experience Our Service?
            </h2>
            <p className="text-gray-600 mb-8">
              Book your ride now and enjoy premium transportation services
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-primary text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
            >
              Book Now
            </motion.button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

export default Services;
