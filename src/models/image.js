const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    subtitle: { type: String },
    tenant: { type: String, required: true },
    section: { type: String, required: true },
    filePath: { type: String, required: true }, // main file (we keep webp here)
    format: { type: String },
    width: { type: Number },
    height: { type: Number },
    convertedFiles: {
      webp: { type: String, required: true },
      avif: { type: String, required: true }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Image', imageSchema);
