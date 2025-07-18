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
        color: "#000000",
        fontFamily: "'Poppins', sans-serif",
        fontWeight: "400",
        "::placeholder": {
          color: "rgba(224, 224, 224, 0.6)",
        },
        iconColor: "#FF6600",
      },
      invalid: {
        color: "#f44336",
        iconColor: "#f44336",
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
    <div className="max-w-lg mx-auto p-8 glass-effect rounded-xl shadow-lg transform transition-all hover-glow">
      <h2 className="text-2xl font-bold mb-6 text-primary text-center">
        Payment Details
      </h2>

      {error && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-500/50 text-red-400 rounded-lg">
          <p className="font-medium">{error}</p>
        </div>
      )}

      <div className="mb-6">
        <div className="flex items-center justify-between">
          <p className="text-gray-500 text-lg">Total Amount:</p>
          <p className="text-primary text-xl font-bold">
            £{selectedQuote?.pricing?.priceNET?.toFixed(2) || "0.00"}
          </p>
        </div>
        <div className="mt-2 h-[1px] bg-white/10"></div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label className="block text-gray-600 text-sm font-medium mb-3">
            Card Information
          </label>
          <div className="p-4 bg-lightBg text-gray-500 border border-gray/10 rounded-lg focus-within:border-primary/50 transition-all">
            <CardElement options={cardElementOptions} />
          </div>
          <p className="mt-2 text-xs text-lightGray/60">
            Your card information is encrypted and secure.
          </p>
        </div>

        <button
          type="submit"
          disabled={isProcessing || !stripe || !elements || !clientSecret}
          className={`w-full bg-primary text-dark font-semibold py-3 px-4 rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-opacity-50 transition-all transform active:scale-95 ${
            isProcessing || !clientSecret ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {isProcessing
            ? "Processing..."
            : clientSecret
            ? "Complete Payment"
            : "Initializing..."}
        </button>

        <p className="mt-4 text-center text-xs text-lightGray/60">
          By completing this payment, you agree to our{" "}
          <a href="/terms" className="text-primary hover:underline">
            Terms of Service
          </a>
          .
        </p>
      </form>
    </div>
  );
};

export default PaymentForm;
