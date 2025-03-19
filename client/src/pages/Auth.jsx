import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaGoogle,
  FaFacebook,
  FaEnvelope,
  FaLock,
  FaUser,
} from "react-icons/fa";
import BackroundImage from "../assets/authBgImage.jpeg";

function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission
    console.log("Form submitted:", formData);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row justify-center items-center pt-20">
      {/* Left Side - Background Image */}
      <div
        className="hidden md:flex md:w-1/2 bg-cover bg-center relative ml-4"
      >
        <img src={BackroundImage} alt="Background" className="rounded-lg " />

        <div className="absolute inset-0 bg-gradient-to-r from-dark/90 to-dark/50 flex items-center justify-center p-12">
          <div className="max-w-xl">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl font-bold text-white mb-4"
            >
              Welcome to TaxiGo
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lightGray text-lg"
            >
              Your premium ride-hailing service. Experience comfort and safety
              with every journey.
            </motion.p>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="w-full md:w-1/2 bg-dark flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Toggle Buttons */}
          <div className="flex mb-8 bg-charcoal rounded-lg p-1">
            <button
              onClick={() => setIsLogin(true)}
              className={`w-1/2 py-3 text-center rounded-lg transition-all duration-300 ${
                isLogin
                  ? "bg-primary text-dark font-semibold"
                  : "text-lightGray"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`w-1/2 py-3 text-center rounded-lg transition-all duration-300 ${
                !isLogin
                  ? "bg-primary text-dark font-semibold"
                  : "text-lightGray"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Auth Form */}
          <AnimatePresence mode="wait">
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
                    className="w-full pl-10 pr-4 py-3 bg-charcoal border border-gray-700 rounded-lg focus:outline-none focus:border-primary text-white placeholder-gray-400"
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
                  className="w-full pl-10 pr-4 py-3 bg-charcoal border border-gray-700 rounded-lg focus:outline-none focus:border-primary text-white placeholder-gray-400"
                />
              </div>

              {/* Password Field */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="text-primary" />
                </div>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Password"
                  className="w-full pl-10 pr-4 py-3 bg-charcoal border border-gray-700 rounded-lg focus:outline-none focus:border-primary text-white placeholder-gray-400"
                />
              </div>

              {/* Submit Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="w-full bg-primary text-dark font-semibold py-3 rounded-lg hover:shadow-glow transition-all duration-300"
              >
                {isLogin ? "Login" : "Create Account"}
              </motion.button>

              {/* Social Login */}
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-dark text-lightGray">
                    Or continue with
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  className="flex items-center justify-center gap-2 py-3 px-4 bg-charcoal rounded-lg hover:bg-charcoal/80 transition-colors duration-300"
                >
                  <FaGoogle className="text-white" />
                  <span className="text-white">Google</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  className="flex items-center justify-center gap-2 py-3 px-4 bg-[#1877F2] rounded-lg hover:bg-[#1877F2]/90 transition-colors duration-300"
                >
                  <FaFacebook className="text-white" />
                  <span className="text-white">Facebook</span>
                </motion.button>
              </div>
            </motion.form>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default Auth;
