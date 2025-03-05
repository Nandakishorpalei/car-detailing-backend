const express = require("express");
const router = express.Router();
const NewsLetterSubscriber = require("../model/newsLetterSubscriber");

router.post("", async (req, res) => {
  try {
    const { email } = req.body;

    const newsLetterSubscriber = new NewsLetterSubscriber({
      email
    });

    const savedNewsLetterSubscriber = await newsLetterSubscriber.save();
    const subscribers = await NewsLetterSubscriber.find();
    console.log({ subscribers });
    res.status(201).send({ success: true, data: savedNewsLetterSubscriber });
  } catch (error) {
    if (error.code === 11000) {
      // Handle duplicate email (unique constraint)
      res.status(400).json({
        success: false,
        message: "This email is already subscribed",
      });
    } else {
      // Handle other server errors
      res.status(500).json({
        success: false,
        message: "An error occurred while subscribing to the newsletter",
        error: err.message,
      });
    }
  }
});

module.exports = router;
