const asyncHandler = require("express-async-handler");
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

// @desc    Register a new user (without immediate authentication)
// @route   POST /api/users/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Check if user exists
  const userExists = await User.findOne({ email });

  if (userExists) {
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
});

// @desc    Authenticate user (without immediate token generation)
// @route   POST /api/users/login
// @access  Public
const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
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
  } else {
    res.status(401).json({
      success: false,
      message: "Email or Password Incorrect",
    });
  }
});

// @desc    Verify OTP and complete authentication
// @route   POST /api/users/verify-otp
// @access  Public
const verifyOTP = asyncHandler(async (req, res) => {
  console.log("Verifying OTP for user:", req.body.email);
  const { email, otp, isRegistration } = req.body;

  if (!email || !otp) {
    return res.status(400).json({
      success: false,
      message: "Email and verification code are required",
    });
  }

  // Handle signup verification
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
      isEmailVerified: true, // User is verified since they confirmed their email
    });

    // Send welcome email after successful verification
    console.log("going to send welcome email to:", user.email);
    await emailService
      .sendWelcomeEmail(user)
      .catch((err) => console.error("Failed to send welcome email:", err));
    console.log("Welcome email sent successfully to:", user.email);
    // Clean up pending registration

    // Clean up pending registration
    pendingUsers.delete(email);

    // Get token and cookie info from generateToken
    const { token, cookieName, cookieOptions } = generateToken(
      user,
      "User registered and verified successfully",
      201
    );

    // Set the cookie
    res.cookie(cookieName, token, cookieOptions);

    // Send response with token
    return res.status(201).json({
      success: true,
      message: "Registration successful! Your email has been verified.",
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      token,
    });
  }
  // Handle login verification
  else {
    const pendingLogin = pendingLogins.get(email);

    if (!pendingLogin) {
      return res.status(400).json({
        success: false,
        message: "No pending login found or OTP expired",
      });
    }

    // Increment attempts
    pendingLogin.attempts += 1;

    // Check if max attempts reached (3 attempts)
    if (pendingLogin.attempts > 3) {
      pendingLogins.delete(email);
      return res.status(400).json({
        success: false,
        message: "Maximum verification attempts exceeded. Please login again.",
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

    // Get the user
    const user = await User.findById(pendingLogin.userId);
    if (!user) {
      pendingLogins.delete(email);
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    // Send welcome email after successful verification
    console.log("going to send welcome email to:", user.email);
    await emailService
      .sendWelcomeEmail(user)
      .catch((err) => console.error("Failed to send welcome email:", err));
    console.log("Welcome email sent successfully to:", user.email);
    // Clean up pending login
    pendingLogins.delete(email);

    // Set user as email verified if not already
    if (!user.isEmailVerified) {
      user.isEmailVerified = true;
      await user.save();
    }

    // Get token and cookie info from generateToken
    const { token, cookieName, cookieOptions } = generateToken(
      user,
      "Login successful",
      200
    );

    // Set the cookie
    res.cookie(cookieName, token, cookieOptions);

    // Send response with token
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
});

// @desc    Resend OTP
// @route   POST /api/users/resend-otp
// @access  Public
const resendOTP = asyncHandler(async (req, res) => {
  const { email, isRegistration } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Email is required",
    });
  }

  // Get the pending user or login
  const pendingData = isRegistration
    ? pendingUsers.get(email)
    : pendingLogins.get(email);

  if (!pendingData) {
    return res.status(400).json({
      success: false,
      message: "No pending verification found",
    });
  }

  // Generate new OTP
  const verificationCode = generateVerificationCode();
  const verificationCodeExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  // Update the stored data
  if (isRegistration) {
    pendingUsers.set(email, {
      ...pendingData,
      verificationCode,
      verificationCodeExpires,
    });
  } else {
    pendingLogins.set(email, {
      ...pendingData,
      verificationCode,
      verificationCodeExpires,
      attempts: 0, // Reset attempts
    });
  }

  // Send new OTP
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
    email,
  });
});

// @desc    Logout user
// @route   GET /api/users/logout
// @access  Public
const logoutUser = asyncHandler(async (req, res) => {
  // Clear user token cookie and admin token cookie
  res.cookie("userToken", "", {
    httpOnly: true,
    expires: new Date(0),
  });

  res.cookie("adminToken", "", {
    httpOnly: true,
    expires: new Date(0),
  });

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
});

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      isEmailVerified: user.isEmailVerified,
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

module.exports = {
  registerUser,
  authUser,
  verifyOTP,
  resendOTP,
  logoutUser,
};
