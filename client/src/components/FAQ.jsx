
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChevronDown } from 'react-icons/fa';

const faqs = [
  {
    question: "How do I book a taxi?",
    answer: "Booking a taxi is simple! Just open our app or website, enter your pickup location and destination, choose your preferred vehicle type, and confirm your booking. You'll receive instant confirmation with driver details."
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit/debit cards, digital wallets (Apple Pay, Google Pay), and cash payments. You can safely store your preferred payment method in the app for faster bookings."
  },
  {
    question: "How are your fares calculated?",
    answer: "Our fares are calculated based on distance, time of day, and vehicle type. You'll see the estimated fare before confirming your booking, with no hidden charges or surprise fees."
  },
  {
    question: "Can I schedule a ride in advance?",
    answer: "Yes! You can schedule rides up to 7 days in advance. This is perfect for airport pickups or important meetings where you need guaranteed transportation."
  },
  {
    question: "What safety measures do you have in place?",
    answer: "We prioritize your safety with verified drivers, real-time trip tracking, emergency assistance button, and regular vehicle inspections. All rides are also insured for your peace of mind."
  }
];

function FAQ() {
  const [activeIndex, setActiveIndex] = useState(null);

  return (
    <section className="py-20 bg-charcoal">
      <div className="container mx-auto px-4">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-3xl md:text-4xl font-bold text-center text-white mb-12"
        >
          Frequently Asked Questions
        </motion.h2>

        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="glass-effect rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setActiveIndex(activeIndex === index ? null : index)}
                className="w-full px-6 py-4 flex items-center justify-between text-left"
              >
                <span className="text-lg font-medium text-white">{faq.question}</span>
                <FaChevronDown
                  className={`text-primary transition-transform duration-300 ${
                    activeIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>
              
              <AnimatePresence>
                {activeIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-4 text-lightGray">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default FAQ;