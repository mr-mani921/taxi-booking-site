const passport = require("passport");
const { Strategy: GoogleStrategy } = require("passport-google-oauth20");
const FacebookStrategy = require("passport-facebook").Strategy;
const User = require("../models/User.js");
const dotenv = require("dotenv");

dotenv.config();

// Configure Passport with Google OAuth strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback",
      scope: ["profile", "email"],
    },  
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists with this Google ID
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          return done(null, user);
        }

        // Check if a user with the same email already exists
        user = await User.findOne({ email: profile.emails[0].value });

        if (user) {
          // User exists but hasn't linked Google account yet, update the user
          user.googleId = profile.id;
          // If the user was created through regular signup but never verified email,
          // we can consider them verified now since Google confirms their email
          if (!user.isEmailVerified) {
            user.isEmailVerified = true;
          }
          // Save Google profile picture if available and user doesn't have one
          if (profile.photos && profile.photos.length > 0 && !user.avatar) {
            user.avatar = profile.photos[0].value;
          }
          await user.save();
          return done(null, user);
        }

        // Create a new user if doesn't exist
        const newUser = new User({
          name: profile.displayName,
          email: profile.emails[0].value,
          googleId: profile.id,
          isEmailVerified: true, // Google verifies emails
          avatar: profile.photos ? profile.photos[0].value : undefined,
        });

        await newUser.save();
        return done(null, newUser);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

// Configure Passport with Facebook OAuth strategy
passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: process.env.FACEBOOK_CALLBACK_URL || 
        (process.env.NODE_ENV === "production"
          ? `${process.env.BACKEND_URL || "https://your-domain.com"}/api/auth/facebook/callback`
          : "http://localhost:5000/api/auth/facebook/callback"),
      profileFields: ["id", "displayName", "photos", "email"], // Request email and profile picture
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Log profile data in development only
        if (process.env.NODE_ENV === "development") {
          console.log("Facebook profile:", JSON.stringify(profile, null, 2));
        }

        // Check if user already exists with this Facebook ID
        let user = await User.findOne({ facebookId: profile.id });

        if (user) {
          return done(null, user);
        }

        // Get email from profile (Facebook may not always provide email)
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;

        if (email) {
          // Check if a user with the same email already exists
          user = await User.findOne({ email: email });

          if (user) {
            // User exists but hasn't linked Facebook account yet, update the user
            user.facebookId = profile.id;
            // If the user was created through regular signup but never verified email,
            // we can consider them verified now since Facebook confirms their email
            if (!user.isEmailVerified) {
              user.isEmailVerified = true;
            }
            // Save Facebook profile picture if available and user doesn't have one
            if (profile.photos && profile.photos.length > 0 && !user.avatar) {
              user.avatar = profile.photos[0].value;
            }
            await user.save();
            return done(null, user);
          }
        }

        // Create a new user if doesn't exist
        // Note: If email is not available, we need to handle this case
        // For now, we'll create user without email (Facebook sometimes doesn't provide email)
        if (!email) {
          if (process.env.NODE_ENV === "development") {
            console.warn("Facebook profile missing email, using displayName as email placeholder");
          }
          // Generate a unique email placeholder - user will need to add email later
          const placeholderEmail = `facebook_${profile.id}@facebook.placeholder`;
          
          // Check if placeholder email already exists (shouldn't happen, but be safe)
          const existingUser = await User.findOne({ email: placeholderEmail });
          if (existingUser) {
            // Link to existing user if found
            existingUser.facebookId = profile.id;
            await existingUser.save();
            return done(null, existingUser);
          }

          const newUser = new User({
            name: profile.displayName || `Facebook User ${profile.id}`,
            email: placeholderEmail,
            facebookId: profile.id,
            isEmailVerified: false, // Email not verified since it's a placeholder
            avatar: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : undefined,
          });

          await newUser.save();
          return done(null, newUser);
        }

        // Email is available - create user normally
        const newUser = new User({
          name: profile.displayName || `Facebook User ${profile.id}`,
          email: email,
          facebookId: profile.id,
          isEmailVerified: true, // Facebook verifies emails when provided
          avatar: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : undefined,
        });

        await newUser.save();
        return done(null, newUser);
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("Facebook OAuth error:", error);
        }
        return done(error, null);
      }
    }
  )
);

// Serialize and deserialize user for session management
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
