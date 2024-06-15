const express = require("express");
const router = express.Router();
const authenticate = require("../middlewares/authenticate");

const User = require("../model/userModel");

router.get("", authenticate, async (req, res) => {
  try {
    const user = await User.find().lean().exec();
    return res.status(200).send({ success: true, user });
  } catch (e) {
    console.log(e.message);
    return res.status(500).send({ success: false, message: e.message });
  }
});

router.get("/:id", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).lean().exec();
    return res.status(200).send({ success: true, user });
  } catch (e) {
    console.log(e.message);
    return res.status(500).send({ success: false, message: e.message });
  }
});

module.exports = router;
