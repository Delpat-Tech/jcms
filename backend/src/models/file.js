// models/file.js
const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
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
    default: 'System'
  },
  collection: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ImageCollection',
    default: null
  },
  collections: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ImageCollection'
  }],
  internalPath: { type: String, required: true },
  fileUrl: { type: String, required: true },
  publicUrl: { type: String },
  originalName: { type: String, required: true },
  fileType: {
    type: String,
    required: true,
    enum: [
      'image',
      'document',
      'spreadsheet',
      'presentation',
      'text',
      'video',
      'audio',
      'archive',
      'code',
      'other'
    ],
  },
  format: { type: String, required: true },
  fileSize: { type: Number, required: true },
  notes: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, { timestamps: true });

module.exports = mongoose.model('File', fileSchema);