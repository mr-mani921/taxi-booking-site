import express from "express";
import {
  authUser,
  logoutUser,
  registerUser,
} from "../controllers/userController.js";
import { authenticateUser } from "../middlewares/authMiddleware.js";
const router = express.Router();

router.post("/register", registerUser);
router.post("/login", authUser);
router.get("/logout", authenticateUser, logoutUser);

export default router;
