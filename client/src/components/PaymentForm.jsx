import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { CardElement, useElements, useStripe } from "@stripe/react-stripe-js";
import {
  createStripePaymentIntent,
  authorizeBid,
  checkBidAvailability,
} from "../store/thunks";
import { setPaymentIntent } from "../store/paymentSlice";
import { setSelectedQuote } from "../store/quoteSlice";
import { FaLock, FaCreditCard, FaCheckCircle } from "react-icons/fa";
import api from "../api/api.js";

const PaymentForm = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { selectedQuote } = useSelector((state) => state.quote);
  const { bookingData } = useSelector((state) => state.booking);

  const stripe = useStripe();
  const elements = useElements();

  const [clientSecret, setClientSecret] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const cardElementOptions = {
    style: {
      base: {
        fontSize: "16px",
        color: "#424770",
        fontFamily: "'Poppins', sans-serif",
        fontWeight: "400",
        letterSpacing: "0.025em",
        "::placeholder": {
          color: "#aab7c4",
        },
        iconColor: "#031d49",
      },
      invalid: {
        color: "#DC3545",
        iconColor: "#DC3545",
      },
    },
    hidePostalCode: true,
    aria: {
      label: "Credit or debit card",
      invalid: "Credit card information is invalid",
    },
  };

  useEffect(() => {
    // Create PaymentIntent only once when quote loads
    const initializeIntent = async () => {
      if (selectedQuote) {
        try {
          // Use the price that already includes profit (in pounds)
          const amount = selectedQuote.pricing?.price || selectedQuote.price;

          const paymentResult = await dispatch(
            createStripePaymentIntent({
              amount: amount,
              currency: "gbp", // Use GBP currency
              description: `Ride payment: ${selectedQuote.vehicleType} to ${
                selectedQuote.destination || "destination"
              }`,
            })
          ).unwrap();

          setClientSecret(paymentResult);
        } catch (err) {
          console.error("Payment intent creation failed:", err);
          setError("Failed to initialize payment");
        }
      }
    };

    initializeIntent();
  }, [dispatch, selectedQuote]);

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
      // STEP 1: Get fresh availability before proceeding
      const availabilityResult = await dispatch(
        checkBidAvailability({
          bidReference: selectedQuote.bidReference,
          vendorId: selectedQuote.vendorId,
        })
      ).unwrap();

      const availabilityReference = availabilityResult.availabilityReference;

      dispatch(
        setSelectedQuote({
          ...selectedQuote,
          availabilityReference,
        })
      );

      // STEP 2: Confirm payment
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        },
      });

      if (result.error) {
        throw new Error(result.error.message);
      } else if (
        result.paymentIntent.status === "succeeded" ||
        result.paymentIntent.status === "requires_capture"
      ) {
        dispatch(setPaymentIntent(result.paymentIntent));

        // STEP 3: Authorize bid
        const bidAuthResponse = await dispatch(
          authorizeBid({ bidReference: selectedQuote.bidReference })
        );
        let captureResponse;

        const isAuthorized =
          bidAuthResponse?.payload?.success === true ||
          bidAuthResponse?.meta?.requestStatus === "fulfilled";
        if (isAuthorized) {
          // STEP 4: Capture payment if needed
          if (result.paymentIntent.status === "requires_capture") {
            captureResponse = await api.captureStripePayment({
              paymentIntentId: result.paymentIntent.id,
            });
            dispatch(setPaymentIntent(captureResponse.data));
          }

          setSelectedQuote({
            ...selectedQuote,
            bookingReference:
              bidAuthResponse?.payload.response
                .AgentBookingAuthorizationResponse.BookingReference,
          });

          navigate("/payment-success", {
            state: {
              paymentData: {
                paymentIntentId: result.paymentIntent.id,
                paymentStatus: result.paymentIntent.status,
                bookingReference:
                  bidAuthResponse?.payload.response
                    .AgentBookingAuthorizationResponse.BookingReference || null,
              },
              selectedQuote,
              bookingData,
            },
          });
        } else {
          throw new Error("Bid authorization failed");
        }
      } else {
        throw new Error(
          "Unexpected payment status: " + result.paymentIntent.status
        );
      }
    } catch (err) {
      setError(err.message || "Payment processing failed");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-8 glass-effect rounded-2xl shadow-card transform transition-all hover-glow">
      <div className="flex justify-center mb-6">
        <div className="bg-primary/10 rounded-full p-3">
          <FaCreditCard className="text-primary w-6 h-6" />
        </div>
      </div>
      
      <h2 className="text-2xl font-bold mb-8 text-primary text-center">
        Payment Details
      </h2>

      {error && (
        <div className="mb-6 p-5 bg-red-50 border border-red-200 text-red-600 rounded-xl shadow-subtle animate-fade-in">
          <p className="font-medium flex items-center">
            <span className="mr-2">⚠️</span> {error}
          </p>
        </div>
      )}

      <div className="mb-8 bg-primary/5 rounded-xl p-5">
        <div className="flex items-center justify-between">
          <p className="text-gray-600 text-lg">Total Amount:</p>
          <p className="text-primary text-xl font-bold">
            £{selectedQuote?.pricing?.priceNET?.toFixed(2) || "0.00"}
          </p>
        </div>
        <div className="mt-2 h-[1px] bg-primary/10"></div>
        
        <div className="mt-3 text-xs text-gray-500 flex items-center">
          <FaCheckCircle className="text-minicabit-accent2 mr-2" />
          <span>Price guaranteed - no hidden fees</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-gray-600 text-sm font-medium mb-3 flex items-center">
            <FaCreditCard className="mr-2 text-primary/70" size={16} />
            Card Information
          </label>
          <div className="p-4 bg-white border border-gray-200 rounded-xl focus-within:border-primary/50 focus-within:shadow-input-focus transition-all duration-250">
            <CardElement options={cardElementOptions} />
          </div>
          <div className="mt-3 text-xs text-gray-500 flex items-center">
            <FaLock className="text-minicabit-accent2 mr-2" size={12} />
            <span>Your payment information is encrypted and secure</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={isProcessing || !stripe || !elements || !clientSecret}
          className={`w-full btn-primary py-4 flex items-center justify-center transition-all duration-250 ${
            isProcessing || !clientSecret 
              ? "opacity-60 cursor-not-allowed" 
              : "hover:translate-y-[-2px]"
          }`}
        >
          {isProcessing ? (
            <div className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </div>
          ) : clientSecret ? (
            "Complete Payment"
          ) : (
            "Initializing..."
          )}
        </button>

        <div className="flex items-center justify-center space-x-4 pt-4">
          <img src="/visa.svg" alt="Visa" className="h-6" />
          <img src="/mastercard.svg" alt="Mastercard" className="h-6" />
        </div>

        <p className="text-center text-xs text-gray-500 pt-2">
          By completing this payment, you agree to our{" "}
          <a href="/terms" className="text-primary hover:underline">
            Terms of Service
          </a>
        </p>
      </form>
    </div>
  );
};

export default PaymentForm;
