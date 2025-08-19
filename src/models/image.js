// models/Image.js
//Image Schema Extended version
const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    subtitle: {
      type: String,
      trim: true,
    },
    filePath: {
      type: String,
      required: true, // path where the image is stored (local or cloud)
    },
    width: {
      type: Number, // in pixels
    },
    height: {
      type: Number, // in pixels
    },
    format: {
      type: String, // e.g., jpg, png, webp
    },
    tenant: {
      type: String, // to separate images by client/organization
      required: true,
    },
    section: {
      type: String, // e.g., "homepage", "gallery", "profile"
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Image", imageSchema);
