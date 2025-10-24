const passport = require("passport");
const { Strategy: GoogleStrategy } = require("passport-google-oauth20");
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
