const mongoose = require("mongoose");

const carSchema = new mongoose.Schema(
  {
    owner_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    model: { type: String, required: true },
    registration_number: { type: String, unique: true, required: true },
    color: { type: String, required: true },
    year: { type: Number, required: true },
  },
  { timestamps: true }
);

const Car = mongoose.model("Car", carSchema);

module.exports = Car;
