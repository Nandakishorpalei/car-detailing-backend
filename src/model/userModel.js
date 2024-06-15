const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: false },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, required: false },
    termsConditions: { type: Boolean, required: false, default: true },
    role: {
      type: String,
      required: false,
      default: "customer",
      enum: ["customer", "seller"],
    },
    phoneOtp: { type: String, required: false, default: null },
    emailOtp: { type: String, required: false, default: null },
    isPhoneVerified: { type: Boolean, required: false, default: false },
    isMailVerified: { type: Boolean, required: false, default: false },
    addresses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Address" }],
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

userSchema.pre("save", function (next) {
  if (!this.isModified("password")) return next();
  this.password = bcrypt.hashSync(this.password, 8);
  next();
});

userSchema.methods.checkPassword = function (password) {
  return bcrypt.compareSync(password, this.password);
};

const User = mongoose.model("user", userSchema);
module.exports = User;
