const User = require("../models/User.js");
const generateToken = require("../utils/generateToken.js");
const {
  generateVerificationCode,
  sendVerificationEmail,
} = require("../utils/emailVerification.js");
const emailService = require("../utils/emailService.js");

// Store temporary user data with OTP (in memory - for production, use Redis or a database)
const pendingUsers = new Map();
const pendingLogins = new Map();

// @desc    Register new user (without immediate authentication)
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    // Generate OTP
    const verificationCode = generateVerificationCode();
    const verificationCodeExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Store pending user data temporarily
    pendingUsers.set(email, {
      name,
      email,
      password,
      verificationCode,
      verificationCodeExpires,
    });

    // Send OTP to user's email
    const emailSent = await sendVerificationEmail(email, verificationCode);

    if (!emailSent) {
      pendingUsers.delete(email);
      return res.status(500).json({
        success: false,
        message: "Failed to send verification email",
      });
    }

    res.status(200).json({
      success: true,
      message: "Verification code sent to your email",
      email,
    });
  } catch (error) {
    console.error("Error in registerUser:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Login user (without immediate authentication)
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Generate OTP
    const verificationCode = generateVerificationCode();
    const verificationCodeExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Store pending login with OTP
    pendingLogins.set(email, {
      userId: user._id,
      verificationCode,
      verificationCodeExpires,
      attempts: 0,
    });

    // Send OTP to user's email
    const emailSent = await sendVerificationEmail(email, verificationCode);

    if (!emailSent) {
      pendingLogins.delete(email);
      return res.status(500).json({
        success: false,
        message: "Failed to send verification email",
      });
    }

    res.status(200).json({
      success: true,
      message: "Verification code sent to your email",
      email,
    });
  } catch (error) {
    console.error("Error in loginUser:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Verify OTP and complete authentication
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOTP = async (req, res) => {
  try {
    console.log("Verifying OTP for user:", req.body.email);
    const { email, otp, isRegistration } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and verification code are required",
      });
    }

    if (isRegistration) {
      const pendingUser = pendingUsers.get(email);

      if (!pendingUser) {
        return res.status(400).json({
          success: false,
          message: "No pending registration found or OTP expired",
        });
      }

      if (pendingUser.verificationCode !== otp) {
        return res.status(400).json({
          success: false,
          message: "Invalid verification code",
        });
      }

      if (pendingUser.verificationCodeExpires < new Date()) {
        pendingUsers.delete(email);
        return res.status(400).json({
          success: false,
          message: "Verification code has expired",
        });
      }

      // Create the user
      const user = await User.create({
        name: pendingUser.name,
        email: pendingUser.email,
        password: pendingUser.password,
        isEmailVerified: true,
      });
      console.log("User registered successfully:", user);
      // Send welcome email after successful verification
      await emailService
        .sendWelcomeEmail(user)
        .catch((err) => console.error("Failed to send welcome email:", err));

      // Clean up pending registration
      pendingUsers.delete(email);

      // Generate token and set cookie
      const { token, cookieName, cookieOptions } = generateToken(
        user,
        "User registered and verified successfully",
        201
      );
      res.cookie(cookieName, token, cookieOptions);

      return res.status(201).json({
        success: true,
        message: "Registration successful! Your email has been verified.",
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        token,
      });
    } else {
      const pendingLogin = pendingLogins.get(email);

      if (!pendingLogin) {
        return res.status(400).json({
          success: false,
          message: "No pending login found or OTP expired",
        });
      }

      // Increment attempts
      pendingLogin.attempts += 1;

      if (pendingLogin.attempts > 3) {
        pendingLogins.delete(email);
        return res.status(400).json({
          success: false,
          message:
            "Maximum verification attempts exceeded. Please login again.",
        });
      }

      if (pendingLogin.verificationCode !== otp) {
        return res.status(400).json({
          success: false,
          message: `Invalid verification code. Attempts remaining: ${
            3 - pendingLogin.attempts
          }`,
        });
      }

      if (pendingLogin.verificationCodeExpires < new Date()) {
        pendingLogins.delete(email);
        return res.status(400).json({
          success: false,
          message: "Verification code has expired",
        });
      }

      const user = await User.findById(pendingLogin.userId);
      if (!user) {
        pendingLogins.delete(email);
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      pendingLogins.delete(email);

      if (!user.isEmailVerified) {
        user.isEmailVerified = true;
        await user.save();
      }

      const { token, cookieName, cookieOptions } = generateToken(
        user,
        "Login successful",
        200
      );
      res.cookie(cookieName, token, cookieOptions);

      return res.status(200).json({
        success: true,
        message: "Login successful!",
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        token,
      });
    }
  } catch (error) {
    console.error("Error in verifyOTP:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
// @access  Public
const resendOTP = async (req, res) => {
  try {
    const { email, isRegistration } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Generate new OTP
    const verificationCode = generateVerificationCode();
    const verificationCodeExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    if (isRegistration) {
      // Check if there's a pending registration
      const pendingUser = pendingUsers.get(email);
      if (!pendingUser) {
        return res.status(400).json({
          success: false,
          message: "No pending registration found",
        });
      }

      // Update verification code
      pendingUser.verificationCode = verificationCode;
      pendingUser.verificationCodeExpires = verificationCodeExpires;
      pendingUsers.set(email, pendingUser);
    } else {
      // Check if there's a pending login
      const pendingLogin = pendingLogins.get(email);
      if (!pendingLogin) {
        return res.status(400).json({
          success: false,
          message: "No pending login found",
        });
      }

      // Reset attempts and update verification code
      pendingLogin.attempts = 0;
      pendingLogin.verificationCode = verificationCode;
      pendingLogin.verificationCodeExpires = verificationCodeExpires;
      pendingLogins.set(email, pendingLogin);
    }

    // Send OTP to user's email
    const emailSent = await sendVerificationEmail(email, verificationCode);

    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: "Failed to send verification email",
      });
    }

    res.status(200).json({
      success: true,
      message: "New verification code sent to your email",
    });
  } catch (error) {
    console.error("Error in resendOTP:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Public
const logout = async (req, res) => {
  // ... existing code ...
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
  // ... existing code ...
};

// @desc    Google OAuth callback
// @route   GET /api/auth/google/callback
// @access  Public
const googleCallback = async (req, res) => {
  // ... existing code ...
};

module.exports = {
  registerUser,
  loginUser,
  verifyOTP,
  resendOTP,
  logout,
  getUserProfile,
  googleCallback,
};
