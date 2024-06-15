const mongoose = require("mongoose");

const productsSchema = new mongoose.Schema(
  {
    files: [
      {
        filename: { type: String, required: true },
        url: { type: String, required: true },
      },
    ],
    title: { type: String, required: true },
    subtitle: { type: String, required: true },
    sizeAndPrice: [
      {
        price: { type: Number, required: true },
        size: { type: String, required: true },
        actualPrice: { type: Number, required: true },
      },
    ],
    ratings: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        rating: { type: Number, required: true },
      },
    ],
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

const Product = mongoose.model("Product", productsSchema);

module.exports = Product;
