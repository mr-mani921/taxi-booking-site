import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { BsCheckCircleFill, BsStarFill } from "react-icons/bs";
import { FaHome, FaHistory } from "react-icons/fa";

const RatingSuccess = () => {
  const navigate = useNavigate();

  // Auto-redirect after some time
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/ride-history");
    }, 10000); // 10 seconds

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto px-4 py-16"
    >
      <div className="max-w-2xl mx-auto bg-dark-lighter rounded-lg overflow-hidden shadow-xl text-center">
        <div className="p-8 bg-primary bg-opacity-10">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <BsCheckCircleFill className="inline-block text-6xl text-primary mb-4" />
          </motion.div>

          <h1 className="text-3xl font-bold text-white mb-2">
            Thank You for Your Feedback!
          </h1>
          <p className="text-gray-300 text-lg">
            Your rating has been submitted successfully.
          </p>
        </div>

        <div className="p-8">
          <div className="flex justify-center mb-8">
            {[1, 2, 3, 4, 5].map((star) => (
              <motion.div
                key={star}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.1 * star }}
              >
                <BsStarFill className="text-3xl text-yellow-400 mx-1" />
              </motion.div>
            ))}
          </div>

          <p className="text-white text-lg mb-8">
            Your feedback helps us improve our service and provide better
            experiences for all riders.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/ride-history")}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
            >
              <FaHistory />
              View Ride History
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/")}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              <FaHome />
              Return Home
            </motion.button>
          </div>

          <div className="mt-8 text-gray-400 text-sm">
            You will be redirected to your ride history in a few seconds...
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default RatingSuccess;
