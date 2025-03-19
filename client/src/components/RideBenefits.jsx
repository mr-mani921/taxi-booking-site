import { motion } from 'framer-motion';
import { FaClock, FaShieldAlt, FaHeadset, FaStar } from 'react-icons/fa';

const benefits = [
  {
    icon: <FaClock className="text-3xl text-primary" />,
    title: "24/7 Availability",
    description: "Book your ride anytime, day or night"
  },
  {
    icon: <FaShieldAlt className="text-3xl text-primary" />,
    title: "Safe & Secure",
    description: "Verified drivers and secure payments"
  },
  {
    icon: <FaHeadset className="text-3xl text-primary" />,
    title: "24/7 Support",
    description: "Always here to help you"
  },
  {
    icon: <FaStar className="text-3xl text-primary" />,
    title: "Best Rates",
    description: "Competitive pricing guaranteed"
  }
];

function RideBenefits() {
  return (
    <section className="py-16 bg-charcoal">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="glass-effect rounded-xl p-6 text-center group hover:border-primary border border-gray-700 transition-all duration-300"
            >
              <div className="mb-4 transform group-hover:scale-110 transition-transform duration-300">
                {benefit.icon}
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {benefit.title}
              </h3>
              <p className="text-lightGray">
                {benefit.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default RideBenefits;