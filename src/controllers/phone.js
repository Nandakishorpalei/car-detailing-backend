require("dotenv").config();
const twilio = require("twilio");
const generateVerificationCode = require("../utils/verificationCode");

const User = require("../model/userModel");

const sendPhoneVerificationSMS = async (req, res) => {
  try {
    const otp = generateVerificationCode();
    const phoneNumber = req.body.phone;
    const messageBody = `Hello,

We're excited to welcome you to our community! To ensure the security of your account and grant you access to our services, we kindly ask you to verify your phone number.

Please use the verification code below:
Verification Code: ${otp}

If you didn't initiate this action, please ignore this message. Your account's safety is our priority.

Thank you for joining us!
-The Nanda Kishor Palei Team`;

    const accountSid = process.env.TWILLIO_SID;
    const authToken = process.env.TWILLIO_AUTHTOKEN;
    const client = new twilio(accountSid, authToken);

    const message = await client.messages.create({
      body: messageBody,
      from: process.env.MY_TWILLIO_NUMBER,
      to: phoneNumber,
    });

    console.log("Message sent:", message.sid);

    let updatedUser = await User.findOneAndUpdate(
      { email: req.body.email },
      { phoneOtp: otp, phone: phoneNumber }
    );
    return res.status(200).send({
      success: true,
      message: `OTP sent to ${phoneNumber} successfully.`,
      data: updatedUser,
    });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
};

const verifyPhone = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    console.log({ phone });
    const user = await User.findOne({ phone }).lean();
    console.log(user, user.phoneOtp, otp, user.phoneOtp === otp);
    if (user.phoneOtp === otp) {
      await User.findOneAndUpdate({ phone }, { isPhoneVerified: true });
      return res.status(200).send({
        success: true,
        message: "Phone verified successfully.",
        data: { ...user, isPhoneVerified: true },
      });
    } else {
      return res.status(400).send({
        success: false,
        message: "Phone OTP did not match. Please try again.",
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

module.exports = {
  sendPhoneVerificationSMS,
  verifyPhone,
};
