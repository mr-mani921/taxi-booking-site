import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  console.log(`the user info in the body is ${name}`);

  // Check if user exists
  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  // Create new user
  const user = await User.create({
    name,
    email,
    password,
  });

  if (user) {
    // Get token and cookie info from generateToken
    const { token, cookieName, cookieOptions, message, statusCode } =
      generateToken(user, "User Registered successfully", 201);

    // Set the cookie
    res.cookie(cookieName, token, cookieOptions);

    // Send the response
    res.status(statusCode).json({
      success: true,
      message,
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      token,
    });
  } else {
    res.status(400).json({ message: "Invalid user data" });
    throw new Error("Invalid user data");
  }
});

// @desc    Authenticate user & get token
// @route   POST /api/users/login
// @access  Public
export const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  console.log("got login request");

  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    // Get token and cookie info from generateToken
    const { token, cookieName, cookieOptions, message, statusCode } =
      generateToken(user, "User logged in successfully", 200);

    // Set the cookie
    res.cookie(cookieName, token, cookieOptions);

    // Send the response
    res.status(statusCode).json({
      success: true,
      message: "User Logged In Successfully",
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      token,
    });
  } else {
    res.status(401).json({
      success: false,
      message: "Email or Password Incorrect",
    });
  }
});

export const logoutUser = asyncHandler(async (req, res) => {
  console.log("request is in the backend logging out");

  // Clear the user token cookie
  res.cookie("userToken", "", {
    httpOnly: true,
    secure: true,
    sameSite: "None",
    path: "/",
    expires: new Date(0),
  });

  // Also clear admin token if exists
  res.cookie("adminToken", "", {
    httpOnly: true,
    secure: true,
    sameSite: "None",
    path: "/",
    expires: new Date(0),
  });

  // Send success response
  res.status(200).json({
    success: true,
    message: "User Logout successfully",
  });
});

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
export const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});
