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
}, { 
  timestamps: true,
  suppressReservedKeysWarning: true // <-- This line is added to remove the warning
});

jsonDocumentSchema.index({ sourceFile: 1, index: 1 });

module.exports = mongoose.model('JsonDocument', jsonDocumentSchema);