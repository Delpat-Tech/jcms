// models/image.js
const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    tenant: { type: String, required: true },
    internalPath: { type: String, required: true }, // For server-side deletion
    fileUrl: { type: String, required: true }, // Full public URL
    format: { 
      type: String, 
      required: true,
      enum: ['webp', 'avif', 'jpg', 'jpeg', 'png'],
    },
    notes: { 
      type: mongoose.Schema.Types.Mixed,
      default: {} 
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Image', imageSchema);