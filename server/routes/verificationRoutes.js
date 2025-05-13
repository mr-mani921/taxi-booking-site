const express = require("express");
const { authenticateUser } = require("../middlewares/authMiddleware.js");
const {
  sendVerificationCode,
  verifyEmail,
} = require("../controllers/verificationController.js");

const router = express.Router();

// @route   POST /api/verification/send-code
// @desc    Send verification code to user's email
// @access  Private
router.post("/send-code", authenticateUser, sendVerificationCode);

// @route   POST /api/verification/verify
// @desc    Verify email with code
// @access  Private
router.post("/verify", authenticateUser, verifyEmail);

module.exports = router;
