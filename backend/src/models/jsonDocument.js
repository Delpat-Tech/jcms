const mongoose = require('mongoose');

const jsonDocumentSchema = new mongoose.Schema({
  sourceFile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    default: null
  },
  collection: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ImageCollection',
    default: null
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  index: {
    type: Number,
    required: true
  }
}, { timestamps: true });

jsonDocumentSchema.index({ sourceFile: 1, index: 1 });

module.exports = mongoose.model('JsonDocument', jsonDocumentSchema);