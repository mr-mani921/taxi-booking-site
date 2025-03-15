import { motion } from 'framer-motion';
import { FaPhoneAlt } from 'react-icons/fa';

function CTABanner() {
  return (
    <section className="py-16 bg-gradient-to-r from-primary/20 to-primary/5">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto"
        >
          <h2 className="text-3xl font-bold text-white mb-4">
            Need Help with Your Booking?
          </h2>
          <p className="text-lightGray mb-8">
            Our support team is available 24/7 to assist you with any questions or concerns
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-primary text-dark px-8 py-3 rounded-lg font-semibold inline-flex items-center gap-2 hover:shadow-glow transition-all duration-300"
          >
            <FaPhoneAlt />
            Contact Support
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}

export default CTABanner;