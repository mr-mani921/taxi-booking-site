import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaChevronDown, FaQuestionCircle } from "react-icons/fa";
import { Link } from "react-router-dom";

const faqs = [
  {
    question: "How do I book a taxi on zappy taxis?",
    answer: (
      <ol className="list-decimal list-inside text-gray-600 space-y-2 pl-4">
        <li>
          Enter your trip information on our website or mobile app - Your pickup
          and dropoff locations, including any 'via' stops on the way, your
          pickup date and time, the number of passengers, and any items of
          luggage
        </li>
        <li>
          Select a quote - Compare a range of real-time quotes from over 1,000
          cab providers across the UK and book the best cab option for you
        </li>
        <li>
          Pay online by credit/debit card, PayPal, Apple Pay, or Google Pay
        </li>
        <li>
          Plans change? You can cancel your booking for a full refund before the
          booking's cancellation cut-off time
        </li>
      </ol>
    ),
  },
  {
    question: "Do I need to call a taxi?",
    answer:
      "Use the website or app to pre-book taxis! You can book a taxi up to 12 months in advance, or the same day as your trip. Simply add the date and time you will need a taxi and choose the quote that works for you to book a taxi in advance.",
  },
  {
    question: "Is it cheaper to book a taxi in advance?",
    answer:
      "At zappy taxis we do our best to bring you the best taxi fares to get around the UK. To get the best price, we recommend that you book as early as possible. Our Flash Sales are also a great way for you to get a cheaper taxi fare.",
  },
  {
    question: "Can I cancel my booking at any time?",
    answer:
      "At zappy taxis cancelling your booking is quick and easy to do. Cancellations will only be processed if you do so via your booking, not by just informing your Cab Operator. For a full refund, you must cancel within your cancellation cut-off period, which is indicated in your booking confirmation email.",
  },
  {
    question: "Are car seats available?",
    answer:
      "If you require a child seat, you must inform your Cab provider once your booking is made. Please note that child seats are subject to availability and are not included in the price for the trip. By Law, children (Under 3 years old) are allowed to travel in the back seats of minicabs without a child seat or seatbelt.",
  },
];

function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-gray-600">
            Find answers to common questions about our service
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="mb-4"
            >
              <div
                onClick={() => toggleFAQ(index)}
                className={`flex justify-between items-center p-5 rounded-lg cursor-pointer ${
                  openIndex === index
                    ? "bg-white shadow-sm border-l-4 border-primary"
                    : "bg-white border border-gray-200"
                }`}
              >
                <div className="flex items-center">
                  <FaQuestionCircle className="text-primary mr-4 flex-shrink-0" />
                  <h3 className="text-lg font-medium text-gray-800">
                    {faq.question}
                  </h3>
                </div>
                <FaChevronDown
                  className={`text-gray-500 transition-transform ${
                    openIndex === index ? "transform rotate-180" : ""
                  }`}
                />
              </div>

              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white px-5 py-6 rounded-b-lg border-t-0 border border-gray-200 shadow-sm"
                  >
                    <div className="prose">
                      {typeof faq.answer === "string" ? (
                        <p className="text-gray-600">{faq.answer}</p>
                      ) : (
                        faq.answer
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center mt-10"
        >
          <Link
            to="/faq"
            className="inline-flex items-center text-primary hover:underline font-medium"
          >
            View more FAQs
            <svg
              className="ml-2 w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 5l7 7-7 7"
              ></path>
            </svg>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

export default FAQ;
