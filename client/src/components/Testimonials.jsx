import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FaQuoteLeft, FaQuoteRight, FaStar } from "react-icons/fa";

const testimonials = [
  {
    name: "Assaf",
    date: "11th July",
    text: "Super",
    rating: 5,
  },
  {
    name: "William",
    date: "11th July",
    text: "Excellent service. Made it easy to relax and work en route.",
    rating: 5,
  },
  {
    name: "Andy",
    date: "11th July",
    text: "Polite driver",
    rating: 4,
  },
  {
    name: "Pauline",
    date: "11th July",
    text: "Very helpful and courteous driver. A pleasure to have used his services.",
    rating: 5,
  },
  {
    name: "SHAUN",
    date: "12th July",
    text: "The driver was both efficient and friendly, which is needed after a flight.",
    rating: 5,
  },
  {
    name: "Amanda",
    date: "12th July",
    text: "New to London he was amazing he was such a pleasure very amazing person o wish all drivers was like him 5* and more he was perfect",
    rating: 5,
  },
];

function Testimonials() {
  const [visibleTestimonials, setVisibleTestimonials] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const testimonialCount =
    window.innerWidth >= 1024 ? 3 : window.innerWidth >= 768 ? 2 : 1;

  useEffect(() => {
    // Set initial visible testimonials
    updateVisibleTestimonials();

    // Set up resize listener
    const handleResize = () => {
      updateVisibleTestimonials();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [currentIndex]);

  const updateVisibleTestimonials = () => {
    const count =
      window.innerWidth >= 1024 ? 3 : window.innerWidth >= 768 ? 2 : 1;
    const updatedTestimonials = [];

    for (let i = 0; i < count; i++) {
      const index = (currentIndex + i) % testimonials.length;
      updatedTestimonials.push(testimonials[index]);
    }

    setVisibleTestimonials(updatedTestimonials);
  };

  const nextTestimonials = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
  };

  const prevTestimonials = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? testimonials.length - 1 : prevIndex - 1
    );
  };

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            See what our customers think
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Trusted by thousands of travellers across the UK
          </p>
        </motion.div>

        <div className="relative max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleTestimonials.map((testimonial, index) => (
              <motion.div
                key={`${testimonial.name}-${index}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-gray-50 p-6 rounded-lg shadow-sm border border-gray-200"
              >
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-semibold">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div className="ml-4">
                    <h3 className="font-semibold text-gray-800">
                      {testimonial.name}
                    </h3>
                    <div className="flex items-center">
                      {Array(5)
                        .fill(0)
                        .map((_, i) => (
                          <FaStar
                            key={i}
                            className={
                              i < testimonial.rating
                                ? "text-primary"
                                : "text-gray-300"
                            }
                            size={14}
                          />
                        ))}
                      <span className="text-xs text-gray-500 ml-2">
                        {testimonial.date}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <FaQuoteLeft
                    className="absolute top-0 left-0 text-gray-200 opacity-50"
                    size={20}
                  />
                  <p className="text-gray-700 italic px-6 py-2">
                    {testimonial.text}
                  </p>
                  <FaQuoteRight
                    className="absolute bottom-0 right-0 text-gray-200 opacity-50"
                    size={20}
                  />
                </div>
              </motion.div>
            ))}
          </div>

          <div className="flex justify-center mt-10 space-x-4">
            <button
              onClick={prevTestimonials}
              className="w-10 h-10 bg-white text-primary border border-primary rounded-full flex items-center justify-center hover:bg-primary hover:text-white transition-colors"
              aria-label="Previous testimonials"
            >
              &lt;
            </button>
            <button
              onClick={nextTestimonials}
              className="w-10 h-10 bg-white text-primary border border-primary rounded-full flex items-center justify-center hover:bg-primary hover:text-white transition-colors"
              aria-label="Next testimonials"
            >
              &gt;
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Testimonials;
