import { motion } from 'framer-motion';
import { FaClock, FaShieldAlt, FaRoute, FaUserTie, FaMobileAlt, FaMoneyBillWave } from 'react-icons/fa';

const features = [
  {
    icon: <FaClock className="text-4xl text-primary" />,
    title: "24/7 Availability",
    description: "Book your ride anytime, day or night. We're always here for you."
  },
  {
    icon: <FaShieldAlt className="text-4xl text-primary" />,
    title: "Safe & Secure",
    description: "Verified drivers and advanced safety features for peace of mind."
  },
  {
    icon: <FaRoute className="text-4xl text-primary" />,
    title: "Smart Routes",
    description: "AI-powered route optimization for faster arrival times."
  },
  {
    icon: <FaUserTie className="text-4xl text-primary" />,
    title: "Professional Drivers",
    description: "Experienced, courteous drivers trained to provide excellent service."
  },
  {
    icon: <FaMobileAlt className="text-4xl text-primary" />,
    title: "Easy Booking",
    description: "Simple, intuitive booking process through our mobile app."
  },
  {
    icon: <FaMoneyBillWave className="text-4xl text-primary" />,
    title: "Best Rates",
    description: "Competitive pricing with no hidden charges or surge fees."
  }
];

function FeatureHighlights() {
  return (
    <section className="py-20 bg-dark relative overflow-hidden">
      <div className="container mx-auto px-4">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-3xl md:text-4xl font-bold text-center text-white mb-16"
        >
          Why Choose Us
        </motion.h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`flex items-center gap-6 group ${
                index % 2 === 0 ? 'lg:pr-12' : 'lg:pl-12'
              }`}
            >
              {/* Icon Container */}
              <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-dark glass-effect border border-primary/30 flex items-center justify-center group-hover:border-primary transition-all duration-300">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="transform transition-transform duration-300"
                >
                  {feature.icon}
                </motion.div>
              </div>

              {/* Content */}
              <div className="flex-grow">
                <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-primary transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-lightGray">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>
    </section>
  );
}

export default FeatureHighlights;