import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import { FaCreditCard, FaLock, FaShieldAlt } from "react-icons/fa";
import PaymentForm from "../components/PaymentForm.jsx";

function Payment() {
  const selectedQuote = useSelector((state) => state.quote.selectedQuote);
  const navigate = useNavigate();

  useEffect(() => {
    if (!selectedQuote) {
      navigate("/quotes");
    }
  }, [selectedQuote, navigate]);

  if (!selectedQuote) {
    return null;
  }

  return (
    <div className="min-h-screen bg-dark pt-20">
      {/* Hero Section */}
      <section className="relative py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-dark/50" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Secure Payment
            </h1>
            <p className="text-lg text-lightGray">
              Complete your booking with our secure payment system
            </p>
          </motion.div>
        </div>
      </section>

      {/* Payment Section */}
      <section className="py-16 bg-charcoal">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            {/* Quote Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="glass-effect rounded-xl p-6 mb-8"
            >
              <h2 className="text-2xl font-bold text-white mb-4">
                Ride Summary
              </h2>
              <div className="grid grid-cols-2 gap-4 text-lightGray">
                <div>
                  <p className="mb-2">Driver</p>
                  <p className="text-white font-semibold">
                    {selectedQuote.driverName}
                  </p>
                </div>
                <div>
                  <p className="mb-2">Vehicle</p>
                  <p className="text-white font-semibold">
                    {selectedQuote.vehicleModel}
                  </p>
                </div>
                <div>
                  <p className="mb-2">Type</p>
                  <p className="text-white font-semibold">
                    {selectedQuote.vehicleType}
                  </p>
                </div>
                <div>
                  <p className="mb-2">Total Price</p>
                  <p className="text-white font-semibold">
                    ${selectedQuote.price?.toFixed(2)}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Security Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
            >
              <div className="glass-effect rounded-xl p-4 text-center">
                <FaCreditCard className="text-primary text-2xl mx-auto mb-2" />
                <p className="text-white font-medium">Secure Payments</p>
              </div>
              <div className="glass-effect rounded-xl p-4 text-center">
                <FaLock className="text-primary text-2xl mx-auto mb-2" />
                <p className="text-white font-medium">Encrypted Data</p>
              </div>
              <div className="glass-effect rounded-xl p-4 text-center">
                <FaShieldAlt className="text-primary text-2xl mx-auto mb-2" />
                <p className="text-white font-medium">Protected Information</p>
              </div>
            </motion.div>

            {/* Payment Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <PaymentForm />
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Payment;
