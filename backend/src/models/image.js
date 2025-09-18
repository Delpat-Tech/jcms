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
    default: null // null for superadmin files
  },
  tenantName: {
    type: String,
    default: 'system' // 'system' for superadmin files
  },
  internalPath: { type: String, required: true },
  fileUrl: { type: String, required: true },
  format: {
    type: String,
    required: true,
    enum: ['webp', 'avif', 'jpg', 'jpeg', 'png', 'gif', 'tiff', 'bmp'],
  },
  fileSize: {
    type: Number,
    default: 0
  },
  notes: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, { timestamps: true });

module.exports = mongoose.model('Image', imageSchema);