// models/image.js
const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  title: { type: String, required: true },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  internalPath: { type: String, required: true },
  fileUrl: { type: String, required: true },
  format: {
    type: String,
    required: true,
    enum: ['webp', 'avif', 'jpg', 'jpeg', 'png'],
  },
  notes: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, { timestamps: true });

module.exports = mongoose.model('Image', imageSchema);