// Import required modules
const express = require("express");
const router = express.Router();
const multer = require("multer");
const { S3Client } = require("@aws-sdk/client-s3");
const multerS3 = require("multer-s3");
const authenticate = require("../middlewares/authenticate");
const User = require("../model/userModel");
const Product = require("../model/productModel");

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

// API endpoint for file upload
router.post(
  "/upload",
  authenticate,
  upload.array("files"),
  async (req, res) => {
    try {
      const files = req.files.map((file) => ({
        filename: file.originalname,
        url: file.location,
      }));

      const {
        title,
        subtitle,
        sizeAndPrice,
        brand,
        model,
        color,
        material,
        weight,
        description,
        price,
        category,
        discount,
        quantity,
        tags,
        dimensions,
      } = req.body;
      const parsedSizeAndPrice = JSON.parse(sizeAndPrice);
      const parsedTags = JSON.parse(tags);
      const parsedDimensions = JSON.parse(dimensions);

      const user = await User.findById(req.user?._id);

      if (!user) {
        return res.status(500).json({
          error: "user not found",
        });
      }

      const productPayload = {
        files,
        title,
        subtitle,
        brand,
        model,
        color,
        material,
        weight,
        description,
        category,
        discount,
        quantity,
        sizeAndPrice: parsedSizeAndPrice,
        tags: parsedTags,
        dimensions: parsedDimensions,
        seller: user._id,
      };

      console.log({ productPayload });

      const product = new Product(productPayload);

      await product.save();

      return res.status(200).send({ success: true, products: product });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        error: e.message || "An error occurred while uploading the files",
      });
    }
  }
);

router.get("", authenticate, async (req, res) => {
  try {
    const {
      category,
      priceMin,
      priceMax,
      sizes,
      brands,
      colors,
      materials,
      ratingsMin,
      ratingsMax,
    } = req.query;

    // Construct the filter object
    const filter = {
      category,
      price: { $gte: priceMin, $lte: priceMax },
      sizes: sizes ? { $in: sizes.split(",") } : { $exists: true },
      brands: brands ? { $in: brands.split(",") } : { $exists: true },
      colors: colors ? { $in: colors.split(",") } : { $exists: true },
      materials: materials ? { $in: materials.split(",") } : { $exists: true },
      ratings: { $gte: ratingsMin, $lte: ratingsMax },
    };

    // Remove fields with value undefined or null
    Object.keys(filter).forEach(
      (key) =>
        filter[key] === undefined ||
        (filter[key] === null && delete filter[key])
    );

    // Find products based on the filter criteria
    const products = await Product.find(filter).lean().exec();

    return res.status(200).send({ success: true, products: products });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      error: e.message || "An error occurred while retrieving user files",
    });
  }
});

router.get("/:id", authenticate, async (req, res) => {
  try {
    const products = await Product.findById(req.params.id).lean().exec();
    return res.status(200).send({ success: true, products: products });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      error: e.message || "An error occurred while retrieving user files",
    });
  }
});

router.get("/myproducts", authenticate, async (req, res) => {
  try {
    const userId = req.user._id;
    const products = await Product.find({ user: userId }).lean().exec();
    return res.status(200).send({ success: true, products: products });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      error: e.message || "An error occurred while retrieving user files",
    });
  }
});

router.delete("/:id", authenticate, async (req, res) => {
  try {
    const products = await Product.findByIdAndDelete(req.params.id)
      .lean()
      .exec();
    return res.status(200).send({ success: true, products: products });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      error: e.message || "An error occurred while retrieving user files",
    });
  }
});

module.exports = router;
