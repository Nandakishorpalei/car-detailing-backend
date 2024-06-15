// Import required modules
const express = require("express");
const router = express.Router();
const multer = require("multer");
const { S3Client } = require("@aws-sdk/client-s3");
const multerS3 = require("multer-s3");
const authenticate = require("../middlewares/authenticate");
const File = require("../model/fileModel");
const User = require("../model/userModel");

const s3 = new S3Client({
  region: "ap-south-1",
  endpoint: "https://s3.ap-south-1.amazonaws.com",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_ACCESS_SECRET_KEY,
  },
});

const upload = multer({
  storage: multerS3({
    s3,
    bucket: process.env.AWS_S3_BUCKET_NAME,
    key: function (req, file, cb) {
      cb(null, Date.now().toString() + "-" + file.originalname);
    },
  }),
});

// Define a Mongoose model for storing file information in MongoDB

// API endpoint for file upload
router.post("", authenticate, upload.single("file"), async (req, res) => {
  try {
    const { originalname } = req.file;
    const user = await User.findById(req.user?._id);

    if (!user) {
      return res.status(500).json({
        error: "user not found",
      });
    }

    const file = new File({
      filename: originalname,
      url: req.file.location,
      user: user._id,
    });
    await file.save();
    console.log("file:", file);
    return res.status(200).send({ success: true, file });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      error: e.message || "An error occurred while uploading the file",
    });
  }
});

module.exports = router;
