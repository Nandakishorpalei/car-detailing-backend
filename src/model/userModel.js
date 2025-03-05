const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const userSchema = new mongoose.Schema(
  {
    id: { type: String, default: uuidv4 },
    name: { type: String, required: false },
    phone: { type: String, required: false, unique: true },
    role: {
      type: String,
      enum: ["customer", "admin"],
      required: false,
      default: "customer",
    },
  },
  {
    versionKey: false,
    timestamps: { createdAt: "created_at", updatedAt: false }, // Map creation time
  }
);

const User = mongoose.model("user", userSchema);
module.exports = User;
