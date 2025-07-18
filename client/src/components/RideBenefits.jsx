import { motion } from "framer-motion";
import {
  FaClock,
  FaShieldAlt,
  FaHeadset,
  FaStar,
  FaMoneyBillWave,
  FaCalendarAlt,
} from "react-icons/fa";

const benefits = [
  {
    icon: <FaCalendarAlt className="text-3xl text-primary" />,
    title: "Free cancellations",
    description: "Plans change? Easily cancel for a full refund",
  },
  {
    icon: <FaShieldAlt className="text-3xl text-primary" />,
    title: "Fully licensed providers",
    description: "Transparent, fixed price rides with quality drivers",
  },
  {
    icon: <FaClock className="text-3xl text-primary" />,
    title: "Free wait time included",
    description: "Up to 15 minutes, 45 minutes at airports",
  },
  {
    icon: <FaMoneyBillWave className="text-3xl text-primary" />,
    title: "Best prices guaranteed",
    description: "Book up to 12 months ahead for better rates",
  },
  {
    icon: <FaHeadset className="text-3xl text-primary" />,
    title: "24/7 Support",
    description: "By email, live chat or phone, we're here to help",
  },
  {
    icon: <FaStar className="text-3xl text-primary" />,
    title: "Highly Rated Service",
    description: "Drivers independently rated by customers",
  },
];

function RideBenefits() {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            Pre-Book Taxis Online - Cheap Zappy Taxis Quotes
          </h2>
          <p className="text-lg text-gray-600">
            Compare fares from over 1,000 taxi firms nationwide in over 550
            towns and cities and save money on your next trip!
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-gray-50 rounded-lg p-6 border border-gray-200 hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-start">
                <div className="mr-4 text-primary">{benefit.icon}</div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-gray-600">{benefit.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default RideBenefits;
