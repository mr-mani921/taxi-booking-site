import jwt from "jsonwebtoken";
import User from "../models/User.js";
import asyncHandler from "express-async-handler";
export const authenticateAdmin = asyncHandler(async (req, res, next) => {
  const token = req.cookies.adminToken;

  if (!token) {
    return res.status(503).json({ message: "You need to Sign In First" });
  }
  const decodedTokenData = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decodedTokenData.id);

  if (!user) {
    return res
      .status(403)
      .json({ message: "You Need To Register As Admin First" });
  }
  req.user = user;
  if (!user.role === "Admin") {
    return res
      .status(403)
      .json({ message: `${req.user.role} Is Not Authorized` });
  }
  next();
});

export const authenticateUser = asyncHandler(async (req, res, next) => {
  const token = req.cookies.userToken || req.cookies.adminToken;
  if (!token) {
    return res.status(503).json({ message: "You need to Sign In First" });
  }
  const decodedTokenData = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decodedTokenData.id);
  if (!user) {
    return next(
      res.status(403).json({ message: "You Need To Register As User First" })
    );
  }
  req.user = user;

  if (!user.role === "user") {
    return res
      .status(403)
      .json({ message: `${req.user.role} Is Not Authorized` });
  }
  next();
});
