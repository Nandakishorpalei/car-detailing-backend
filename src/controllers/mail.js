require("dotenv").config();
const nodemailer = require("nodemailer");
const generateVerificationCode = require("../utils/verificationCode");
const { google } = require("googleapis");
const User = require("../model/userModel");

const OAuth2 = google.auth.OAuth2;

// OAuth2 client setup
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = "https://developers.google.com/oauthplayground"; // Must match your Google Cloud Console configuration

const oAuth2Client = new OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
oAuth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });

// Send Mail Handler
const sendMail = async (req, res) => {
  try {
    console.log("coming here 0", oAuth2Client)
    // Await the access token
    const googleToken = await oAuth2Client.getAccessToken();
    console.log("coming here 1")
    const token = googleToken.token;
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: process.env.MY_EMAIL,
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN,
        accessToken: token, // Use the refreshed access token
      },
      tls: {
        rejectUnauthorized: true,
      },
    });

    // Generate and send the verification email
    const userEmailAddress = "nandakishorpalei7676@gmail.com";  // Recipient email
    const verificationCode = generateVerificationCode();
    const mailOptions = {
      from: '"Nanda Kishor Palei" <nandakishorpalei7676@gmail.com>',
      to: userEmailAddress, // List of recipients
      subject: "Please Verify Your Email Address 📧",
      html: `
        <div style="background-color: #f5f5f5; padding: 20px; color: black; font-size: 18px;">
          <p>Hello,</p>
          <p>We're excited to welcome you to our community! To ensure the security of your account and grant you access to our services, we kindly ask you to verify your email address.</p>
          <p>Please use the verification code below:</p>
          <p>Verification Code: <b>${verificationCode}</b></p>
          <p>If you didn't initiate this action, please ignore this email. Your account's safety is our priority.</p>
          <p>Thank you for joining us!</p>
          <p><em>The Nanda Kishor Palei Team</em></p>
        </div>
      `,
    };
    console.log("coming here")
    // Send the email and update the user with the OTP
    await transporter.sendMail(mailOptions);
    await User.findOneAndUpdate(
      { email: req.body.email },
      { emailOtp: verificationCode }
    );

    // Respond with success message
    return res.status(200).send({
      success: true,
      message: `OTP sent to ${req.body.email} successfully.`,
    });
  } catch (e) {
    console.error('Error sending mail:', e.message);
    return res.status(500).send({ success: false, message: e.message });
  }
};

// Verify Mail OTP
const verifyMail = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email }).lean();
    
    if (!user) {
      return res.status(400).send({
        success: false,
        message: "User not found.",
      });
    }

    // Trim and compare OTPs to avoid issues with extra spaces
    const isOtpValid = user.emailOtp && user.emailOtp.trim() === otp.trim();
    
    if (isOtpValid) {
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
    console.error('Error verifying mail:', e.message);
    return res.status(500).send({
      success: false,
      message: e.message,
    });
  }
};

// Export handlers
module.exports = { sendMail, verifyMail };
