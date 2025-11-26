const express = require("express");
const passport = require("passport");
const generateToken = require("../utils/generateToken.js");

const router = express.Router();

// @route   GET /api/auth/google
// @desc    Start Google OAuth process
// @access  Public
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// @route   GET /api/auth/google/callback
// @desc    Google OAuth callback
// @access  Public
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/login",
  }),
  (req, res) => {
    // Generate JWT token
    const { token, cookieName, cookieOptions } = generateToken(
      req.user,
      "Login successful with Google",
      200
    );

    // Set cookie
    res.cookie(cookieName, token, cookieOptions);

    // Determine redirect URL - in production you might want to redirect to frontend URL
    const redirectUrl =
      process.env.NODE_ENV === "production"
        ? `${process.env.FRONTEND_URL}/auth-success?token=${token}`
        : `http://localhost:5173/auth-success?token=${token}`;

    // Redirect to frontend with token
    res.redirect(redirectUrl);
  }
);

// @route   GET /api/auth/google/mobile-callback
// @desc    Google OAuth callback for mobile apps or frontend that uses popup
// @access  Public
router.get(
  "/google/mobile-callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/login",
  }),
  (req, res) => {
    // Generate JWT token
    const { token, cookieName, cookieOptions } = generateToken(
      req.user,
      "Login successful with Google",
      200
    );

    // Set cookie
    res.cookie(cookieName, token, cookieOptions);

    // Return user info with token
    res.status(200).json({
      success: true,
      message: "Google login successful!",
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      isAdmin: req.user.isAdmin,
      isEmailVerified: req.user.isEmailVerified,
      avatar: req.user.avatar,
      token,
    });
  }
);

// @route   GET /api/auth/facebook
// @desc    Start Facebook OAuth process
// @access  Public
router.get(
  "/facebook",
  passport.authenticate("facebook", { 
    scope: ["email", "public_profile"] // Request email and public profile
  })
);

// @route   GET /api/auth/facebook/callback
// @desc    Facebook OAuth callback
// @access  Public
router.get(
  "/facebook/callback",
  passport.authenticate("facebook", {
    session: false,
    failureRedirect: process.env.NODE_ENV === "production"
      ? `${process.env.FRONTEND_URL}/login?error=facebook_auth_failed`
      : "http://localhost:5173/login?error=facebook_auth_failed",
  }),
  (req, res) => {
    try {
      // Generate JWT token
      const { token, cookieName, cookieOptions } = generateToken(
        req.user,
        "Login successful with Facebook",
        200
      );

      // Set cookie
      res.cookie(cookieName, token, cookieOptions);

      // Determine redirect URL - in production you might want to redirect to frontend URL
      const redirectUrl =
        process.env.NODE_ENV === "production"
          ? `${process.env.FRONTEND_URL}/auth-success?token=${token}`
          : `http://localhost:5173/auth-success?token=${token}`;

      // Redirect to frontend with token
      res.redirect(redirectUrl);
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Facebook callback error:", error);
      }
      const errorRedirectUrl =
        process.env.NODE_ENV === "production"
          ? `${process.env.FRONTEND_URL}/login?error=auth_failed`
          : "http://localhost:5173/login?error=auth_failed";
      res.redirect(errorRedirectUrl);
    }
  }
);

// @route   GET /api/auth/facebook/mobile-callback
// @desc    Facebook OAuth callback for mobile apps or frontend that uses popup
// @access  Public
router.get(
  "/facebook/mobile-callback",
  passport.authenticate("facebook", {
    session: false,
    failureRedirect: "/login",
  }),
  (req, res) => {
    try {
      // Generate JWT token
      const { token, cookieName, cookieOptions } = generateToken(
        req.user,
        "Login successful with Facebook",
        200
      );

      // Set cookie
      res.cookie(cookieName, token, cookieOptions);

      // Return user info with token
      res.status(200).json({
        success: true,
        message: "Facebook login successful!",
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        isAdmin: req.user.isAdmin,
        isEmailVerified: req.user.isEmailVerified,
        avatar: req.user.avatar,
        token,
      });
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Facebook mobile callback error:", error);
      }
      res.status(500).json({
        success: false,
        message: "Facebook authentication failed",
      });
    }
  }
);

module.exports = router;
