import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { motion } from "framer-motion";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { setPaymentStatus, setPaymentError } from "../store/quoteSlice.js";



const PaymentForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [processing, setProcessing] = useState(false);
  const selectedQuote = useSelector((state) => state.quote.selectedQuote);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    dispatch(setPaymentStatus("processing"));

    try {
      // Replace with actual payment processing
      const { error } = await stripe.createPaymentMethod({
        type: "card",
        card: elements.getElement(CardElement),
      });

      if (error) {
        throw error;
      }

      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      dispatch(setPaymentStatus("success"));
      navigate("/booking-confirmation");
    } catch (error) {
      dispatch(setPaymentError(error.message));
      dispatch(setPaymentStatus("error"));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="glass-effect rounded-xl p-6">
        <div className="mb-6">
          <label className="block text-white text-sm font-medium mb-2">
            Card Information
          </label>
          <div className="bg-dark/50 border border-gray-600 rounded-lg p-4">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: "16px",
                    color: "#FFFFFF",
                    "::placeholder": {
                      color: "#A0AEC0",
                    },
                  },
                  invalid: {
                    color: "#EF4444",
                  },
                },
              }}
            />
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={!stripe || processing}
          className={`w-full bg-primary text-dark font-semibold py-3 rounded-lg hover:shadow-glow transition-all duration-300 ${
            processing ? "opacity-75 cursor-not-allowed" : ""
          }`}
        >
          {processing ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-dark"></div>
              <span className="ml-2">Processing...</span>
            </div>
          ) : (
            `Pay $${selectedQuote.price.toFixed(2)}`
          )}
        </motion.button>
      </div>
    </form>
  );
};

export default PaymentForm;
