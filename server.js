require("dotenv").config();
const express = require("express");
const app = express();
const passport = require("./src/configs/passport");
const cors = require("cors");
const session = require("express-session");

app.use(
  cors({
    origin: "http://localhost:3000", // Replace with your React app's URL
    credentials: true, // Enable cookies and other credentials in CORS requests
  })
);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static("public"));

app.use(passport.initialize());
app.use(
  session({
    resave: false,
    saveUninitialized: true,
    secret: "bla bla bla",
  })
);

passport.serializeUser(function (user, callback) {
  callback(null, user);
});

passport.deserializeUser(function (user, callback) {
  callback(null, user);
});

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["email", "profile"] })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/auth/google/failure",
  }),
  (req, res) => {
    console.log({ user: req.user.user, token: req.user.token });

    const redirectUrl = `http://localhost:3000/success?userdata=${encodeURIComponent(
      JSON.stringify(req.user?.user)
    )}&token=${encodeURIComponent("Bearer " + req.user?.token)}`;
    res.redirect(redirectUrl);
  }
);

app.get("/auth/google/failure", (req, res) => {
  return res.send({ success: false, message: "Failure" });
});

const { signup, signin } = require("./src/controllers/authController");
app.use("/signup", signup);
app.use("/signin", signin);

const { sendMail, verifyMail } = require("./src/controllers/mail");
app.use("/sendotptomail", sendMail);
app.post("/verifyemail", verifyMail);

const {
  sendPhoneVerificationSMS,
  verifyPhone,
} = require("./src/controllers/phone");
app.use("/sendotptophone", sendPhoneVerificationSMS);
app.post("/verifyphone", verifyPhone);

const userController = require("./src/controllers/userController");
app.use("/users", userController);

const awsFileController = require("./src/controllers/AWSFileController");
app.use("/upload", awsFileController);

const fileController = require("./src/controllers/fileController");
app.use("/files", fileController);

const productController = require("./src/controllers/productController");
app.use("/product", productController);

const addressController = require("./src/controllers/addressController");
app.use("/address", addressController);

module.exports = app;
