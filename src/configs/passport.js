require("dotenv").config();
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth2").Strategy;
const { v4: uuidv4 } = require("uuid");

const User = require("../model/userModel");

const { newToken } = require("../controllers/authController");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_AUTH_CLIENT_ID,
      clientSecret: process.env.GOOGLE_AUTH_CLIENT_SECRET,
      callbackURL: "http://localhost:8000/auth/google/callback",
      scope: ["profile", "email"],
      userProfileURL: "https://**www**.googleapis.com/oauth2/v3/userinfo",
      passReqToCallback: true,
    },
    async function (request, accessToken, refreshToken, profile, done) {
      console.log({ profile });
      let user = await User.findOne({ email: profile?._json?.email })
        .select("-phoneOtp -emailOtp -password")
        .lean()
        .exec();

      if (!user) {
        user = await User.create({
          email: profile?._json?.email,
          password: uuidv4(),
          roles: ["seller"],
          firstName: profile?._json?.firstName || profile?._json?.given_name,
          lastName: profile?._json?.family_name,
          isMailVerified: true,
        }).select("-phoneOtp -emailOtp -password");
      }

      const token = newToken(user);
      console.log({ user, token });
      return done(null, { user, token }); // user: {user, token}
    }
  )
);

passport.serializeUser(function (user, callback) {
  callback(null, user);
});

passport.deserializeUser(function (user, callback) {
  callback(null, user);
});

module.exports = passport;
