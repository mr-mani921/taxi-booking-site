import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const testimonials = [
  {
    name: "John Doe",
    rating: 5,
    text: "Best taxi service I've ever used! Professional drivers and clean cars."
  },
  {
    name: "Jane Smith",
    rating: 5,
    text: "Excellent service and very punctual. Highly recommended!"
  },
  {
    name: "Mike Johnson",
    rating: 4,
    text: "Great experience overall. The app is very user-friendly."
  }
];

function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="py-20 bg-dark relative">
      <div className="container mx-auto px-4">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-3xl md:text-4xl font-bold text-center text-white mb-12"
        >
          What Our Customers Say
        </motion.h2>

        <div className="max-w-3xl mx-auto">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="testimonial-card p-8 text-center"
          >
            <div className="flex justify-center mb-4">
              {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                <span key={i} className="text-primary text-2xl">★</span>
              ))}
            </div>
            <p className="text-lg mb-4 text-white">"{testimonials[currentIndex].text}"</p>
            <p className="font-medium text-primary">{testimonials[currentIndex].name}</p>
          </motion.div>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>
    </section>
  );
}

export default Testimonials;