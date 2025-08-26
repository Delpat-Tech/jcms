// models/image.js
const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    
    tenant: { type: String, required: true },
    
    filePath: { type: String, required: true }, // The path to the single converted file
    fileUrl: { type: String },
    format: { 
      type: String, 
      required: true,
      enum: ['webp', 'avif', 'jpg', 'png','jpeg'],// Only allow these two formats
    },

    // ✅ New Notes Field (JSON)
    notes: { 
      type: mongoose.Schema.Types.Mixed, // allows storing any JSON object
      default: {} 
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Image', imageSchema);
