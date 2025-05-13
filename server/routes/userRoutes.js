const express = require("express");
const {
  authUser,
  logoutUser,
  registerUser,
  verifyOTP,
  resendOTP,
} = require("../controllers/userController.js");
const { authenticateUser } = require("../middlewares/authMiddleware.js");
const router = express.Router();

router.post("/register", registerUser);
router.post("/login", authUser);
router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendOTP);
router.get("/logout", logoutUser);

module.exports = router;
