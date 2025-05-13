const User = require("../models/User.js");
const {
  generateVerificationCode,
  sendVerificationEmail,
} = require("../utils/emailVerification.js");

// @desc    Send verification code to user's email
// @route   POST /api/verification/send-code
// @access  Private
const sendVerificationCode = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: "Email is already verified" });
    }

    const verificationCode = generateVerificationCode();
    const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.verificationCode = verificationCode;
    user.verificationCodeExpires = verificationCodeExpires;
    await user.save();

    const emailSent = await sendVerificationEmail(user.email, verificationCode);

    if (!emailSent) {
      return res
        .status(500)
        .json({ message: "Failed to send verification email" });
    }

    res.status(200).json({ message: "Verification code sent successfully" });
  } catch (error) {
    console.error("Error in sendVerificationCode:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Verify email with code
// @route   POST /api/verification/verify
// @access  Private
const verifyEmail = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ message: "Verification code is required" });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: "Email is already verified" });
    }

    if (user.verificationCode !== code) {
      return res.status(400).json({ message: "Invalid verification code" });
    }

    if (user.verificationCodeExpires < new Date()) {
      return res.status(400).json({ message: "Verification code has expired" });
    }

    user.isEmailVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Email verified successfully" });
  } catch (error) {
    console.error("Error in verifyEmail:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  sendVerificationCode,
  verifyEmail,
};
