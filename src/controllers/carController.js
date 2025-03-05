// Import required modules
const express = require("express");
const router = express.Router();
const authenticate = require("../middlewares/authenticate");
const User = require("../model/userModel");
const Cars = require("../model/Car");

router.get("", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    let query = {};

    // If user is not an admin, fetch only their cars
    if (user.role !== "admin") {
      query.user_id = req.user._id;
    }

    const cars = await Cars.find().lean().exec();

    return res.status(200).json({ success: true, cars });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: error.message || "An error occurred while fetching cars",
    });
  }
});

module.exports = router;
