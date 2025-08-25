// models/image.js
const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    subtitle: { type: String },
    tenant: { type: String, required: true },
    section: { type: String, required: true },
    filePath: { type: String, required: true }, // The path to the single converted file
    format: { 
      type: String, 
      required: true,
      enum: ['webp', 'avif'] // Only allow these two formats
    },
    width: { type: Number },
    height: { type: Number },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Image', imageSchema);