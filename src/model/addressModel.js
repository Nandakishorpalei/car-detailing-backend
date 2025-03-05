const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema(
  {
    email: { type: String, required: true },
    lastName: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
    phoneNumber: { type: String, required: true },
  },
  {
    versionKey: false,
  }
);

const Address = mongoose.model("Address", addressSchema);

module.exports = Address;
