const express = require("express");
const router = express.Router();
const passport = require("../configs/passport");

router.get(
  "/google/callback",
  passport.authenticate("google", {
    successRedirect: "http://localhost:3000/",
    failureRedirect: "/login/failed",
  })
);

router.get("/google", passport.authenticate("google", ["profile", "email"]));

router.get("/login/success", (req, res) => {
  if (req.user) {
    return res
      .status(200)
      .send({ success: true, message: "Successfully logged in", user: user });
  } else {
    return res.status(403).send({ success: false, message: "Not authorized" });
  }
});

router.get("/login/failed", (req, res) => {
  return res
    .status(401)
    .send({ success: false, message: "Google authentication failure" });
});

router.get("/logout", (req, res) => {
  req.logout();
  req.redirect("http://localhost:3000/signup");
});

module.exports = router;
