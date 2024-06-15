// Import required modules
const express = require("express");
const router = express.Router();
const authenticate = require("../middlewares/authenticate");
const File = require("../model/fileModel");

// // Create a Mongoose model for your file data (e.g., a schema with a file field)
// const File = mongoose.model("File", {
//   filename: String,
//   path: String,
// });

// // Set up Multer for handling file uploads
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "uploads/"); // The directory where uploaded files will be stored
//   },
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + path.extname(file.originalname)); // Rename the file to a unique name
//   },
// });

// const upload = multer({ storage });

// // Define an endpoint to handle file uploads
// router.post("", upload.single("file"), async (req, res) => {
//   try {
//     // Save file information to the database

//     const file = new File({
//       filename: req.file.filename,
//       path: req.file.path,
//     });
//     const savedFile = await file.save();
//     return res.status(200).send({ success: true, file: savedFile });
//   } catch (error) {
//     console.log({ error });
//     res
//       .status(500)
//       .json({ error: "An error occurred while uploading the file" });
//   }
// });

router.get("", authenticate, async (req, res) => {
  try {
    const userId = req.user._id;

    // Find all files associated with the user
    const userFiles = await File.find({ user: userId }).lean().exec();
    return res.status(200).send({ success: true, data: userFiles });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      error: e.message || "An error occurred while retrieving user files",
    });
  }
});

router.delete("/:id", authenticate, async (req, res) => {
  try {
    const userFiles = await File.findByIdAndDelete(req.params.id).lean().exec();
    return res.status(200).send({ success: true, data: userFiles });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      error: e.message || "An error occurred while retrieving user files",
    });
  }
});

module.exports = router;
