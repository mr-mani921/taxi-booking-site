import { useState } from "react";
import { useDispatch } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes, FaCreditCard } from "react-icons/fa";
import { processPayment } from "../store/thunks/paymentThunks";
import { showSuccess, showError } from "../utils/toast";

const PaymentModal = ({ show, onClose, amount, onPaymentComplete, rideId }) => {
  const dispatch = useDispatch();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("CARD");
  const [cardDetails, setCardDetails] = useState({
    cardNumber: "",
    expiryMonth: "",
    expiryYear: "",
    cvv: "",
    cardholderName: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCardDetails((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      // Validate card details
      if (!validateCardDetails()) {
        showError("Please fill in all card details correctly");
        setIsProcessing(false);
        return;
      }

      // Process payment
      const result = await dispatch(
        processPayment({
          rideId,
          amount,
          paymentMethod,
          cardDetails,
        })
      ).unwrap();

      if (result.success) {
        showSuccess("Payment processed successfully");
        onPaymentComplete();
      } else {
        showError(result.message || "Payment failed");
      }
    } catch (error) {
      console.error("Payment error:", error);
      showError("Failed to process payment");
    } finally {
      setIsProcessing(false);
    }
  };

  const validateCardDetails = () => {
    const { cardNumber, expiryMonth, expiryYear, cvv, cardholderName } =
      cardDetails;

    // Basic validation
    if (!cardNumber || cardNumber.length < 16) return false;
    if (!expiryMonth || !expiryYear) return false;
    if (!cvv || cvv.length < 3) return false;
    if (!cardholderName) return false;

    return true;
  };

  if (!show) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="bg-white rounded-lg p-6 w-full max-w-md relative"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            disabled={isProcessing}
          >
            <FaTimes />
          </button>

          <div className="text-center mb-6">
            <FaCreditCard className="text-4xl text-primary mx-auto mb-2" />
            <h2 className="text-2xl font-bold">Payment Required</h2>
            <p className="text-gray-600">Amount: £{amount.toFixed(2)}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Card Number
              </label>
              <input
                type="text"
                name="cardNumber"
                value={cardDetails.cardNumber}
                onChange={handleInputChange}
                placeholder="1234 5678 9012 3456"
                className="w-full px-3 py-2 border rounded-md"
                maxLength="16"
                disabled={isProcessing}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiry Month
                </label>
                <input
                  type="text"
                  name="expiryMonth"
                  value={cardDetails.expiryMonth}
                  onChange={handleInputChange}
                  placeholder="MM"
                  className="w-full px-3 py-2 border rounded-md"
                  maxLength="2"
                  disabled={isProcessing}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiry Year
                </label>
                <input
                  type="text"
                  name="expiryYear"
                  value={cardDetails.expiryYear}
                  onChange={handleInputChange}
                  placeholder="YY"
                  className="w-full px-3 py-2 border rounded-md"
                  maxLength="2"
                  disabled={isProcessing}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CVV
              </label>
              <input
                type="text"
                name="cvv"
                value={cardDetails.cvv}
                onChange={handleInputChange}
                placeholder="123"
                className="w-full px-3 py-2 border rounded-md"
                maxLength="4"
                disabled={isProcessing}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cardholder Name
              </label>
              <input
                type="text"
                name="cardholderName"
                value={cardDetails.cardholderName}
                onChange={handleInputChange}
                placeholder="John Doe"
                className="w-full px-3 py-2 border rounded-md"
                disabled={isProcessing}
                required
              />
            </div>

            <button
              type="submit"
              className={`w-full py-3 rounded-md text-white font-medium
                ${
                  isProcessing
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-primary hover:bg-primary-dark"
                }`}
              disabled={isProcessing}
            >
              {isProcessing ? "Processing..." : "Pay Now"}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default PaymentModal;
