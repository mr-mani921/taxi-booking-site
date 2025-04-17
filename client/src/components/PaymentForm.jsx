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
    aria: {
      label: "Credit or debit card",
      invalid: "Credit card information is invalid",
    },
  };

  useEffect(() => {
    // Create PaymentIntent only once when quote loads
    const initializeIntent = async () => {
      if (selectedQuote?.pricing.priceNET) {
        try {
          const paymentResult = await dispatch(
            createStripePaymentIntent({
              amount: selectedQuote.pricing.priceNET,
              currency: "usd",
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
        console.log("the bid auth response is", bidAuthResponse);
        console.log(
          "the bid auth response is",
          bidAuthResponse.payload.success
        );
        const isAuthorized =
          bidAuthResponse?.payload?.success === true ||
          bidAuthResponse?.meta?.requestStatus === "fulfilled";
        if (isAuthorized) {
          // STEP 4: Capture payment if needed
          if (result.paymentIntent.status === "requires_capture") {
            captureResponse = api.captureStripePayment(result.paymentIntent.Id);
          }

          navigate("/payment-success", {
            state: {
              paymentData: {
                paymentIntentId: result.paymentIntent.id,
                paymentStatus: result.paymentIntent.status,
                bookingReference:
                  bidAuthResponse?.agentBookingReference || null,
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
