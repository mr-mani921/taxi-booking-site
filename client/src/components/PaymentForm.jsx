import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { CardElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { createStripePaymentIntent } from "../store/thunks";

const PaymentForm = () => {
  const dispatch = useDispatch();
  const { selectedQuote } = useSelector((state) => state.quote);

  const stripe = useStripe();
  const elements = useElements();

  const [clientSecret, setClientSecret] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  // Card element options with improved accessibility
  const cardElementOptions = {
    style: {
      base: {
        fontSize: "16px",
        color: "#424770",
        "::placeholder": {
          color: "#aab7c4",
        },
      },
      invalid: {
        color: "#9e2146",
      },
    },
    hidePostalCode: true,
    // Options to improve accessibility
    aria: {
      label: "Credit or debit card",
      invalid: "Credit card information is invalid",
    },
  };

  useEffect(() => {
    // Create PaymentIntent when component mounts
    const fetchPaymentIntent = async () => {
      console.log("the intent is been creating and the selectedQuote price is ", selectedQuote.pricing.priceNET)
      if (selectedQuote?.pricing.priceNET) {
        try {

          const result = await dispatch(
            createStripePaymentIntent({
              amount: selectedQuote.pricing.priceNET, // Convert to cents
              currency: "usd",
              description: `Ride payment: ${selectedQuote.vehicleType} to ${
                selectedQuote.destination || "destination"
              }`,
            })
          ).unwrap();
          console.log("the client secret is", result)
          setClientSecret(result);
        } catch (err) {
          setError("Failed to initialize payment");
          console.error("Payment intent creation failed:", err);
        }
      }
    };

    fetchPaymentIntent();
  }, [selectedQuote, dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsProcessing(true);

    if (!stripe || !elements || !clientSecret) {
      setError("Stripe has not loaded correctly or payment is not initialized");
      setIsProcessing(false);
      return;
    }

    try {
      // Confirm the card payment (pre-authorization only)
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        },
      });

      if (result.error) {
        throw new Error(result.error.message);
      } else if (
        result.paymentIntent.status === "requires_capture" ||
        result.paymentIntent.status === "succeeded"
      ) {
        // Proceed to book the ride
        console.log("Payment successful", result.paymentIntent.id);
        // TODO: Dispatch booking action and navigate
        // navigate("/confirmation");
      } else {
        throw new Error(
          "Unexpected payment status: " + result.paymentIntent.status
        );
      }
    } catch (err) {
      console.log(err);
      setError(err.message || "Payment processing failed");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Payment Details</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Card Details
          </label>
          <div className="p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500">
            <CardElement options={cardElementOptions} />
          </div>
        </div>

        <button
          type="submit"
          disabled={isProcessing || !stripe || !elements || !clientSecret}
          className={`w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 ${
            isProcessing || !clientSecret ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {isProcessing
            ? "Processing..."
            : clientSecret
            ? "Pay Now"
            : "Initializing..."}
        </button>
      </form>
    </div>
  );
};

export default PaymentForm;