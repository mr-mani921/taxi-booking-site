import express from "express";
import {
  authUser,
  logoutUser,
  registerUser,
  verifyOTP,
  resendOTP,
} from "../controllers/userController.js";
import { authenticateUser } from "../middlewares/authMiddleware.js";
const router = express.Router();

router.post("/register", registerUser);
router.post("/login", authUser);
router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendOTP);
router.get("/logout", logoutUser);

export default router;
