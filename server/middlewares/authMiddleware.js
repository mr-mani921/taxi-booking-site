const jwt = require("jsonwebtoken");
const User = require("../models/User.js");
const asyncHandler = require("express-async-handler");

const authenticateAdmin = asyncHandler(async (req, res, next) => {
  const token = req.cookies.adminToken;

  if (!token) {
    res.status(503);
    throw new Error("You need to Sign In First");
  }

  try {
    const decodedTokenData = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decodedTokenData.id);

    if (!user) {
      res.status(403);
      throw new Error("You Need To Register As Admin First");
    }

    req.user = user;

    if (!user.role === "Admin") {
      res.status(403);
      throw new Error(`${req.user.role} Is Not Authorized`);
    }

    next();
  } catch (error) {
    res.status(401);
    throw new Error("Not authorized, token failed");
  }
});

const authenticateUser = asyncHandler(async (req, res, next) => {
  const token = req.cookies.userToken || req.cookies.adminToken;

  if (!token) {
    res.status(503);
    throw new Error("You need to Sign In First");
  }

  try {
    const decodedTokenData = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decodedTokenData.id);

    if (!user) {
      res.status(403);
      throw new Error("You Need To Register As User First");
    }

    req.user = user;

    if (!user.role === "user") {
      res.status(403);
      throw new Error(`${req.user.role} Is Not Authorized`);
    }

    next();
  } catch (error) {
    res.status(401);
    throw new Error("Not authorized, token failed");
  }
});

module.exports = {
  authenticateAdmin,
  authenticateUser,
};
