// const mongoose = require("mongoose");

// const filesSchema = new mongoose.Schema(
//   {
//     filename: { type: String, required: true },
//     url: { type: String, required: true },
//     user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
//   },
//   {
//     versionKey: false,
//     timestamps: true,
//   }
// );

// const File = mongoose.model("File", filesSchema);

// module.exports = File;

// file mongoose model
const mongoose = require("mongoose");

const filesSchema = new mongoose.Schema(
  {
    files: [
      {
        filename: { type: String, required: true },
        url: { type: String, required: true },
      },
    ],
    title: { type: String, required: true },
    subtitle: { type: String, required: true },
    sizeAndPrice: { type: Array, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

const File = mongoose.model("File", filesSchema);

module.exports = File;
