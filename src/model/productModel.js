const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    subtitle: { type: String, required: true },
    description: { type: String, required: true },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    files: [
      {
        filename: { type: String, required: true },
        url: { type: String, required: true },
      },
    ],
    sizeAndPrice: [
      {
        size: { type: String, required: true },
        price: { type: Number, required: true },
        actualPrice: { type: Number, required: true },
        remainingQuantity: { type: Number, default: 0 },
        discount: { type: Number, default: 0 },
      },
    ],
    category: { type: String, required: true },
    tags: [{ type: String }],
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
    brand: { type: String },
    modelDetails: { type: String },
    color: { type: String },
    material: { type: String },
    weight: { type: Number },
    length: { type: Number },
    width: { type: Number },
    height: { type: Number },
    averageRating: { type: Number, default: 0 },
    numRatings: { type: Number, default: 0 },
    totalBuy: { type: Number, default: 0 },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
