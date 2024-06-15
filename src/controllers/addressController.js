const express = require("express");
const router = express.Router();
const Address = require("../model/addressModel");
const User = require("../model/userModel");
const authenticate = require("../middlewares/authenticate");

router.post("", authenticate, async (req, res) => {
  try {
    const { street, city, state, postalCode, country, phoneNumber } = req.body;

    const user = await User.findById(req.user?._id);

    if (!user) {
      return res.status(500).json({
        error: "user not found",
      });
    }
    const userId = user._id;

    const newAddress = new Address({
      firstName,
      lastName,
      street,
      city,
      state,
      postalCode,
      country,
      phoneNumber,
    });

    const savedAddress = await newAddress.save();

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $push: { addresses: savedAddress._id } },
      { new: true }
    ).populate("addresses");

    res.status(200).send({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      error: error.message || "An error occurred while adding the address",
    });
  }
});

module.exports = router;
