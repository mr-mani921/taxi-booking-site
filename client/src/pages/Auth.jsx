import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaGoogle,
  FaFacebook,
  FaEnvelope,
  FaLock,
  FaUser,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import BackroundImage from "../assets/authBgImage.jpeg";
import { useDispatch, useSelector } from "react-redux";
import { loginUser, registerUser } from "../store/thunks.js";
import { useNavigate } from "react-router-dom";
import OTPVerification from "../components/OTPVerification";

// Function to handle Google login
const handleGoogleLogin = () => {
  // Redirect to Google OAuth endpoint on the backend
  window.location.href = `${
    import.meta.env.VITE_API_URL || "http://localhost:5000"
  }/api/auth/google`;
};

// Function to handle Facebook login
const handleFacebookLogin = () => {
  // Redirect to Facebook OAuth endpoint on the backend
  window.location.href = `${
    import.meta.env.VITE_API_URL || "http://localhost:5000"
  }/api/auth/facebook`;
};

function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [showOTPVerification, setShowOTPVerification] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, pendingAuth } = useSelector((state) => state.user);
  const { loading } = useSelector((state) => state.api);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
  });

  // This useEffect runs on component mount to check authentication
  useEffect(() => {
    // If user is already authenticated, redirect to return path or home
    if (isAuthenticated) {
      const returnPath = localStorage.getItem("returnPath");
      if (returnPath) {
        localStorage.removeItem("returnPath");
        navigate(returnPath);
      } else {
        navigate("/");
      }
    }
  }, [isAuthenticated, navigate]);

  // This useEffect runs whenever isAuthenticated changes
  useEffect(() => {
    // If user becomes authenticated after login/signup, redirect to home
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  // This useEffect runs when pendingAuth changes
  useEffect(() => {
    if (pendingAuth) {
      setShowOTPVerification(true);
    } else {
      setShowOTPVerification(false);
    }
  }, [pendingAuth]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      // Dispatch the appropriate action based on whether we're in login or register mode
      let result;
      if (isLogin) {
        result = await dispatch(loginUser(formData)).unwrap();
      } else {
        result = await dispatch(registerUser(formData)).unwrap();
      }

      // If the result indicates OTP verification is required, show the success message
      if (result.requireOTP) {
        setSuccess(result.message);
      }

      // Reset form data correctly if not requiring OTP verification
      if (!result.requireOTP) {
        setFormData({
          email: "",
          password: "",
          name: "",
        });
      }
    } catch (err) {
      setError(err.message || "Authentication failed");
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleBackFromOTP = () => {
    setShowOTPVerification(false);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row justify-center items-center pt-20">
      {/* Left Side - Background Image */}
      <div className="hidden md:flex md:w-1/2 bg-cover bg-center relative ml-4">
        <img src={BackroundImage} alt="Background" className="rounded-lg " />

        <div className="absolute inset-0 bg-gradient-to-r from-white/90 to-white/50 flex items-center justify-center p-12">
          <div className="max-w-xl">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl font-bold text-gray-800 mb-4"
            >
              Welcome to ZappyTaxi
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-gray-600 text-lg"
            >
              Your premium ride-hailing service. Experience comfort and safety
              with every journey.
            </motion.p>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="w-full md:w-1/2 bg-white flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Error and Success Messages */}
          {error && (
            <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 mb-4 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-400 text-green-700 px-4 py-3 mb-4 rounded-lg">
              {success}
            </div>
          )}
          {/* Toggle Buttons */}
          {!showOTPVerification && (
            <div className="flex mb-8 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setIsLogin(true)}
                className={`w-1/2 py-3 text-center rounded-lg transition-all duration-300 ${
                  isLogin
                    ? "bg-primary text-white font-semibold"
                    : "text-gray-600"
                }`}
              >
                Login
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`w-1/2 py-3 text-center rounded-lg transition-all duration-300 ${
                  !isLogin
                    ? "bg-primary text-white font-semibold"
                    : "text-gray-600"
                }`}
              >
                Sign Up
              </button>
            </div>
          )}

          {/* Auth Form or OTP Verification */}
          <AnimatePresence mode="wait">
            {showOTPVerification ? (
              <motion.div
                key="otp-verification"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <OTPVerification onBack={handleBackFromOTP} />
              </motion.div>
            ) : (
              <motion.form
                key={isLogin ? "login" : "signup"}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                {/* Name Field (Sign Up only) */}
                {!isLogin && (
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaUser className="text-primary" />
                    </div>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Full Name"
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:border-primary text-gray-700 placeholder-gray-500"
                    />
                  </div>
                )}

                {/* Email Field */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaEnvelope className="text-primary" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Email Address"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:border-primary text-gray-700 placeholder-gray-500"
                  />
                </div>

                {/* Password Field */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaLock className="text-primary" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Password"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:border-primary text-gray-700 placeholder-gray-500"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-primary text-xl"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>

                {/* Submit Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading?.user}
                  className={`w-full font-semibold py-3 rounded-lg transition-all duration-300 ${
                    loading?.user
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-primary text-white hover:shadow-glow"
                  }`}
                >
                  {loading?.user
                    ? "Processing..."
                    : isLogin
                    ? "Login"
                    : "Create Account"}
                </motion.button>

                {/* Social Login */}
                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-600">
                      Or continue with
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="flex items-center justify-center py-2 px-4 bg-gray-100 rounded-lg text-gray-700 hover:bg-gray-200 transition-colors"
                  >
                    <FaGoogle className="mr-2 text-red-500" />
                    Continue with Google
                  </button>
                  <button
                    type="button"
                    onClick={handleFacebookLogin}
                    className="flex items-center justify-center py-2 px-4 bg-gray-100 rounded-lg text-gray-700 hover:bg-gray-200 transition-colors"
                  >
                    <FaFacebook className="mr-2 text-blue-600" />
                    Continue with Facebook
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default Auth;
