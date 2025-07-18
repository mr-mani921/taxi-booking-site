import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChevronDown, FaSearch } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const faqCategories = [
  {
    category: "Booking & Rides",
    questions: [
      {
        q: "How do I book a ride?",
        a: "You can book a ride through our mobile app or website. Simply enter your pickup location, destination, and preferred vehicle type, then confirm your booking."
      },
      {
        q: "What payment methods do you accept?",
        a: "We accept credit/debit cards, digital wallets (Apple Pay, Google Pay), and cash payments. You can save your preferred payment method in the app for faster bookings."
      },
      {
        q: "Can I schedule a ride in advance?",
        a: "Yes! You can schedule rides up to 7 days in advance. This is perfect for airport pickups or important meetings."
      }
    ]
  },
  {
    category: "Pricing & Payment",
    questions: [
      {
        q: "How are fares calculated?",
        a: "Fares are calculated based on distance, time of day, and vehicle type. You'll see the estimated fare before confirming your booking."
      },
      {
        q: "Are there any additional charges?",
        a: "All charges are transparent and shown before booking. Additional charges may apply for waiting time, toll roads, or special requests."
      }
    ]
  },
  {
    category: "Safety & Security",
    questions: [
      {
        q: "What safety measures do you have in place?",
        a: "We prioritize safety with verified drivers, real-time trip tracking, emergency assistance button, and regular vehicle inspections. All rides are insured."
      },
      {
        q: "Can I share my ride status with others?",
        a: "Yes, you can share your live trip status with trusted contacts through our app for added safety and peace of mind."
      }
    ]
  }
];

function FAQ() {
  const [activeCategory, setActiveCategory] = useState(faqCategories[0].category);
  const [activeQuestionId, setActiveQuestionId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate()

  const filteredQuestions = faqCategories.flatMap(category => 
    category.questions.filter(q => 
      q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.a.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  return (
    <div className="min-h-screen bg-white pt-20">
      {/* Hero Section */}
      <section className="relative py-16 overflow-hidden bg-gray-50">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50 to-white/90" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Find answers to common questions about our services
            </p>

            {/* Search Bar */}
            <div className="relative max-w-xl mx-auto">
              <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg pl-12 pr-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          {searchQuery ? (
            // Search Results
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-800 mb-8">
                Search Results ({filteredQuestions.length})
              </h2>
              <div className="space-y-4">
                {filteredQuestions.map((question, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="border border-gray-200 rounded-xl overflow-hidden shadow-sm"
                  >
                    <button
                      onClick={() => setActiveQuestionId(activeQuestionId === index ? null : index)}
                      className="w-full px-6 py-4 flex items-center justify-between text-left bg-white"
                    >
                      <span className="text-lg font-medium text-gray-800">{question.q}</span>
                      <FaChevronDown
                        className={`text-primary transition-transform duration-300 ${
                          activeQuestionId === index ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    <AnimatePresence>
                      {activeQuestionId === index && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: 'auto' }}
                          exit={{ height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="px-6 pb-4 text-gray-600 bg-white">
                            {question.a}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            </div>
          ) : (
            // Categorized FAQ
            <div className="max-w-3xl mx-auto">
              {/* Category Tabs */}
              <div className="flex flex-wrap gap-4 mb-8">
                {faqCategories.map((category, index) => (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    onClick={() => setActiveCategory(category.category)}
                    className={`px-6 py-2 rounded-lg font-medium transition-all duration-300 ${
                      activeCategory === category.category
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category.category}
                  </motion.button>
                ))}
              </div>

              {/* Questions */}
              <div className="space-y-4">
                {faqCategories
                  .find(cat => cat.category === activeCategory)
                  ?.questions.map((question, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                      className="border border-gray-200 rounded-xl overflow-hidden shadow-sm"
                    >
                      <button
                        onClick={() => setActiveQuestionId(activeQuestionId === index ? null : index)}
                        className="w-full px-6 py-4 flex items-center justify-between text-left bg-white"
                      >
                        <span className="text-lg font-medium text-gray-800">{question.q}</span>
                        <FaChevronDown
                          className={`text-primary transition-transform duration-300 ${
                            activeQuestionId === index ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      <AnimatePresence>
                        {activeQuestionId === index && (
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: 'auto' }}
                            exit={{ height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <div className="px-6 pb-4 text-gray-600 bg-white">
                              {question.a}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Still Have Questions?
            </h2>
            <p className="text-gray-600 mb-8">
              Can&apos;t find what you&apos;re looking for? Our support team is here to help.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-primary text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
              onClick={() => {navigate('/contact')}}
            >
              Contact Support
            </motion.button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

export default FAQ;
