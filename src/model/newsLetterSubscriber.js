const mongoose = require("mongoose");

const newsLetterSubscriberSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
  },
  {
    versionKey: false,
  }
);

const NewsLetterSubscriber = mongoose.model("NewsLetterSubscriber", newsLetterSubscriberSchema);

module.exports = NewsLetterSubscriber;
