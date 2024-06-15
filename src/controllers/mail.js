require("dotenv").config();
const nodemailer = require("nodemailer");
const generateVerificationCode = require("../utils/verificationCode");
const { google } = require("googleapis");

const User = require("../model/userModel");

const OAuth2 = google.auth.OAuth2;

// Replace with your OAuth 2.0 client credentials
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = "https://developers.google.com/oauthplayground"; // Must match your Google Cloud Console configuration

const oAuth2Client = new OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

// Replace with your OAuth 2.0 refresh token
oAuth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });

const sendMail = async (req, res) => {
  try {
    const accessToken = oAuth2Client.getAccessToken();
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: process.env.MY_EMAIL,
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN,
        accessToken: accessToken,
      },
      tls: {
        rejectUnauthorized: true,
      },
    });

    // Generate and send verification email
    // "upasanakuar44@gmail.com"
    const userEmailAddress = "nandakishorpalei7676@gmail.com";
    const verificationCode = generateVerificationCode();
    const mailOptions = {
      from: '"Nanda kishor palei" <nandakishorpalei7676@gmail.com>',
      to: userEmailAddress, // list of recipients with commas
      subject: "Please Verify Your Email Address 📧",
      html: `
    <div style="background-color: #f5f5f5; padding: 20px; color: black; font-size: 18px;">
      <p style="color: black;">Hello,</p>
      <p style="color: black;">We're excited to welcome you to our community! To ensure the security of your account and grant you access to our services, we kindly ask you to verify your email address.</p>
      <p style="color: black;">Please use the verification code below:</p>
      <p>Verification Code: <b>${verificationCode}</b></p>
      <p style="color: black;">If you didn't initiate this action, please ignore this email. Your account's safety is our priority.</p>
      <p style="color: black;>"Thank you for joining us!</p>
      <p style="color: black;"><em>The Nanda Kishor Palei Team</em></p>
    </div>
  `,
    };

    const emailInfo = await transporter.sendMail(mailOptions);
    let user = await User.findOneAndUpdate(
      { email: req.body.email },
      { emailOtp: verificationCode }
    );
    return res.status(200).send({
      success: true,
      message: `OTP sent to ${req.body.email} successfully.`,
    });
  } catch (e) {
    return res.status(500).send({ success: false, message: e.message });
  }
};

const verifyMail = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email }).lean();
    console.log(user.emailOtp, otp, user.emailOtp === otp);
    if (user.emailOtp === otp) {
      await User.findOneAndUpdate({ email }, { isMailVerified: true });
      return res.status(200).send({
        success: true,
        message: "Email verified successfully.",
        data: { ...user, isMailVerified: true },
      });
    } else {
      return res.status(400).send({
        success: false,
        message: "Email OTP did not match. Please try again.",
      });
    }
  } catch (e) {
    console.log(e.message);
    return res.status(500).send({
      success: false,
      message: e.message,
    });
  }
};

module.exports = { sendMail, verifyMail };
