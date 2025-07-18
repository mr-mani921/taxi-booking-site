import { motion } from "framer-motion";
import { FaStar, FaQuoteLeft } from "react-icons/fa";

// Sample testimonial data
const testimonials = [
  {
    id: 1,
    name: "William",
    date: "July 11",
    text: "Excellent service. Made it easy to relax and work en route.",
    rating: 5,
  },
  {
    id: 2,
    name: "Amanda",
    date: "July 12",
    text: "New to London he was amazing he was such a pleasure very amazing person I wish all drivers was like him. 5* and more he was perfect!",
    rating: 5,
  },
  {
    id: 3,
    name: "Jeffrey",
    date: "July 12",
    text: "Great guy. Would use again.",
    rating: 5,
  },
  {
    id: 4,
    name: "Howard",
    date: "July 13",
    text: "Excellent in all respects.",
    rating: 5,
  },
];

function BookingTestimonials() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            Trusted by millions of travellers, UK wide
          </h2>
          <p className="text-lg text-gray-600">
            Read what our customers have to say about their experience
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-semibold mr-3">
                  {testimonial.name.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-gray-800">
                    {testimonial.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {testimonial.date}
                  </div>
                </div>
              </div>

              <div className="mb-3 flex">
                {[...Array(5)].map((_, i) => (
                  <FaStar
                    key={i}
                    className={`${
                      i < testimonial.rating ? "text-primary" : "text-gray-300"
                    } w-4 h-4`}
                  />
                ))}
              </div>

              <div className="relative">
                <FaQuoteLeft className="absolute -top-1 -left-1 text-gray-200 opacity-30 text-lg" />
                <p className="text-gray-600 text-sm pl-3 leading-relaxed">
                  {testimonial.text}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default BookingTestimonials;
