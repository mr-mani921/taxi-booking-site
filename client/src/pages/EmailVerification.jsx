import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FaEnvelope,
  FaCheckCircle,
  FaExclamationTriangle,
} from "react-icons/fa";
import { sendVerificationCode, verifyEmail } from "../store/thunks";

const EmailVerification = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [verificationCode, setVerificationCode] = useState("");
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);

  const isAuthenticated = useSelector((state) => state.user.isAuthenticated);
  const isEmailVerified = useSelector((state) => state.user.isEmailVerified);
  const emailVerificationStatus = useSelector(
    (state) => state.user.emailVerificationStatus
  );
  const loading = useSelector((state) => state.api.loading.user);
  const profile = useSelector((state) => state.user.profile);

  useEffect(() => {
    // Redirect if not authenticated
    if (!isAuthenticated) {
      navigate("/auth");
    }

    // Redirect if already verified
    if (isEmailVerified) {
      navigate("/profile");
    }
  }, [isAuthenticated, isEmailVerified, navigate]);

  useEffect(() => {
    // Handle countdown for resending code
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendVerificationCode = () => {
    setError("");
    dispatch(sendVerificationCode())
      .unwrap()
      .then(() => {
        setCountdown(60); // 60 seconds cooldown
      })
      .catch((err) => {
        setError(err.message || "Failed to send verification code");
      });
  };

  const handleVerifyEmail = (e) => {
    e.preventDefault();
    setError("");

    if (!verificationCode.trim()) {
      setError("Please enter verification code");
      return;
    }

    dispatch(verifyEmail(verificationCode))
      .unwrap()
      .then(() => {
        // Success will redirect via the useEffect
      })
      .catch((err) => {
        setError(err.message || "Invalid verification code");
      });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-dark-lighter rounded-lg shadow-lg overflow-hidden"
      >
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="mx-auto h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center mb-4">
              <FaEnvelope className="text-primary text-3xl" />
            </div>
            <h2 className="text-2xl font-bold text-white">Verify Your Email</h2>
            <p className="text-gray-400 mt-2">
              We've sent a verification code to{" "}
              <span className="text-primary">{profile?.email}</span>
            </p>
          </div>

          {emailVerificationStatus === "success" ? (
            <div className="text-center mb-8">
              <div className="mx-auto h-20 w-20 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                <FaCheckCircle className="text-green-500 text-3xl" />
              </div>
              <h3 className="text-xl font-semibold text-white">
                Email Verified!
              </h3>
              <p className="text-gray-400 mt-2">
                Your email has been successfully verified.
              </p>
              <button
                onClick={() => navigate("/profile")}
                className="mt-6 w-full bg-primary text-white py-3 rounded-lg hover:bg-primary-dark transition-colors"
              >
                Continue to Profile
              </button>
            </div>
          ) : (
            <form onSubmit={handleVerifyEmail} className="space-y-6">
              <div>
                <label
                  htmlFor="code"
                  className="block text-sm font-medium text-gray-300 mb-1"
                >
                  Verification Code
                </label>
                <input
                  id="code"
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  className="w-full px-4 py-3 bg-charcoal border border-gray-700 rounded-lg focus:outline-none focus:border-primary text-white placeholder-gray-500"
                  maxLength={6}
                />
              </div>

              {error && (
                <div className="flex items-center text-red-500">
                  <FaExclamationTriangle className="mr-2" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex flex-col space-y-3">
                <button
                  type="submit"
                  disabled={loading || !verificationCode.trim()}
                  className={`w-full py-3 rounded-lg font-medium ${
                    loading || !verificationCode.trim()
                      ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                      : "bg-primary text-white hover:bg-primary-dark"
                  } transition-colors`}
                >
                  {loading && emailVerificationStatus === "verifying"
                    ? "Verifying..."
                    : "Verify Email"}
                </button>

                <button
                  type="button"
                  onClick={handleSendVerificationCode}
                  disabled={loading || countdown > 0}
                  className={`w-full py-3 rounded-lg font-medium ${
                    loading || countdown > 0
                      ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                      : "bg-dark-lightest text-gray-300 hover:bg-gray-700"
                  } transition-colors`}
                >
                  {loading && emailVerificationStatus === "pending"
                    ? "Sending..."
                    : countdown > 0
                    ? `Resend Code (${countdown}s)`
                    : "Send Verification Code"}
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default EmailVerification;
