import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { verifyOTP, resendOTP } from "../store/thunks";
import { FaCheckCircle, FaExclamationCircle, FaRedo } from "react-icons/fa";
import { motion } from "framer-motion";

const OTPVerification = ({ onBack }) => {
  const dispatch = useDispatch();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resendDisabled, setResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [focusedInput, setFocusedInput] = useState(0);
  const inputRefs = useRef([]);

  const { pendingAuth } = useSelector((state) => state.user);
  const { loading } = useSelector((state) => state.api);

  useEffect(() => {
    // If no pending auth, redirect back
    if (!pendingAuth) {
      onBack();
    }
  }, [pendingAuth, onBack]);

  useEffect(() => {
    // Focus first input on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (countdown === 0) {
      setResendDisabled(false);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleInputChange = (index, value) => {
    // Only allow numbers
    if (value && !/^\d*$/.test(value)) return;

    const newOtp = [...otp];

    // Handle paste event (multiple digits at once)
    if (value.length > 1) {
      const digits = value.split("").slice(0, 6);
      for (let i = 0; i < digits.length; i++) {
        if (index + i < 6) {
          newOtp[index + i] = digits[i];
        }
      }
      setOtp(newOtp);

      // Focus the input after the last pasted digit
      const nextIndex = Math.min(index + digits.length, 5);
      if (inputRefs.current[nextIndex]) {
        inputRefs.current[nextIndex].focus();
        setFocusedInput(nextIndex);
      }
      return;
    }

    // Handle single digit input
    newOtp[index] = value;
    setOtp(newOtp);

    // If input is filled, focus next input
    if (value !== "" && index < 5) {
      if (inputRefs.current[index + 1]) {
        inputRefs.current[index + 1].focus();
        setFocusedInput(index + 1);
      }
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === "Backspace") {
      if (otp[index] === "" && index > 0) {
        // If current input is empty and backspace is pressed, focus previous input
        const newOtp = [...otp];
        newOtp[index - 1] = "";
        setOtp(newOtp);
        if (inputRefs.current[index - 1]) {
          inputRefs.current[index - 1].focus();
          setFocusedInput(index - 1);
        }
      }
    }
    // Handle arrow keys
    else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1].focus();
      setFocusedInput(index - 1);
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1].focus();
      setFocusedInput(index + 1);
    }
  };

  const handleVerify = async () => {
    // Reset messages
    setError("");
    setSuccess("");

    // Check if OTP is complete
    const otpValue = otp.join("");
    if (otpValue.length !== 6) {
      setError("Please enter the complete 6-digit verification code");
      return;
    }

    // Dispatch verify OTP action
    try {
      const result = await dispatch(
        verifyOTP({
          email: pendingAuth.email,
          otp: otpValue,
          isRegistration: pendingAuth.isRegistration,
        })
      ).unwrap();

      setSuccess(result.message || "Verification successful!");
    } catch (err) {
      setError(err.message || "Verification failed. Please try again.");
    }
  };

  const handleResendOTP = async () => {
    // Reset messages
    setError("");
    setSuccess("");

    // Disable resend button and start countdown
    setResendDisabled(true);
    setCountdown(60); // 60 seconds cooldown

    try {
      const result = await dispatch(
        resendOTP({
          email: pendingAuth.email,
          isRegistration: pendingAuth.isRegistration,
        })
      ).unwrap();

      setSuccess(result.message || "Verification code resent successfully!");
    } catch (err) {
      setError(err.message || "Failed to resend verification code");
      // Re-enable the button if there's an error
      setResendDisabled(false);
      setCountdown(0);
    }
  };

  if (!pendingAuth) {
    return null;
  }

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full bg-white rounded-lg p-8 shadow-lg border border-gray-200"
      >
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-6">
          Verification Required
        </h2>

        <p className="text-gray-600 text-center mb-8">
          We've sent a verification code to{" "}
          <span className="text-primary font-medium">{pendingAuth.email}</span>.
          Please enter the 6-digit code below.
        </p>

        {/* OTP Input Fields */}
        <div className="flex justify-between mb-8 gap-1 md:gap-2">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              maxLength={6} // Allow paste of entire OTP
              value={digit}
              onChange={(e) => handleInputChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onFocus={() => setFocusedInput(index)}
              className={`w-9 h-12 md:w-12 md:h-14 text-center text-xl font-bold rounded-md bg-gray-50 text-gray-800 border-2 
                ${
                  focusedInput === index ? "border-primary" : "border-gray-300"
                } 
                focus:outline-none focus:border-primary transition-colors`}
            />
          ))}
        </div>

        {/* Error and Success Messages */}
        {error && (
          <div className="flex items-center text-red-600 mb-4">
            <FaExclamationCircle className="mr-2" />
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="flex items-center text-green-600 mb-4">
            <FaCheckCircle className="mr-2" />
            <p>{success}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-4">
          <button
            onClick={handleVerify}
            disabled={loading?.user || otp.join("").length !== 6}
            className={`w-full py-3 rounded-lg font-semibold transition-colors 
              ${
                loading?.user || otp.join("").length !== 6
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-primary text-white hover:bg-primary/90"
              }`}
          >
            {loading?.user ? "Verifying..." : "Verify"}
          </button>

          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              Back to Login
            </button>

            <button
              onClick={handleResendOTP}
              disabled={resendDisabled}
              className={`flex items-center text-primary hover:text-primary/80 transition-colors 
                ${resendDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <FaRedo className="mr-2" />
              {resendDisabled ? `Resend in ${countdown}s` : "Resend Code"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default OTPVerification;
