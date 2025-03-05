const mongoose = require("mongoose");

const serviceDetailsSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    car_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Car",
      required: true,
    },
    pre_service_photos: [
      {
        originalname: { type: String, required: true },
        location: { type: String, required: true },
      },
    ],
    post_service_photos: [
      {
        originalname: { type: String, required: true },
        location: { type: String, required: true },
      },
    ],
    work_status: {
      type: String,
      enum: ["pending", "in_progress", "completed", "rejected"],
      default: "pending",
      required: false,
    },
  },
  {
    versionKey: false,
    timestamps: { createdAt: "created_at", updatedAt: false },
  }
);

const ServiceDetails = mongoose.model("ServiceDetails", serviceDetailsSchema);

module.exports = ServiceDetails;
