// models/image.js
const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  title: { type: String, required: true },
  filename: { type: String, required: true }, // Original filename
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
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content', // Link to project/content
    default: null
  },
  collection: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ImageCollection', // Link to image collection/group (legacy single collection)
    default: null
  },
  collections: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ImageCollection' // Multiple collections support
  }],
  internalPath: { type: String, required: true },
  fileUrl: { type: String, required: true },
  publicUrl: { type: String }, // Local public URL
  cloudflareUrl: { type: String }, // Cloudflare R2 public URL
  cloudflareKey: { type: String }, // R2 object key
  format: {
    type: String,
    required: true,
    enum: ['webp', 'avif', 'jpg', 'jpeg', 'png', 'gif', 'tiff', 'bmp'],
  },
  fileSize: {
    type: Number,
    default: 0
  },
  visibility: {
    type: String,
    enum: ['private', 'public'],
    default: 'private'
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  publicationDate: {
    type: Date,
    default: null
  },
  metadata: {
    width: { type: Number },
    height: { type: Number },
    aspectRatio: { type: String },
    colorSpace: { type: String },
    hasAlpha: { type: Boolean },
    originalSize: { type: Number }, // Size before processing
    compressionRatio: { type: Number }
  },
  tags: [{
    type: String,
    trim: true
  }],
  notes: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // Activity tracking
  accessCount: {
    type: Number,
    default: 0
  },
  lastAccessed: {
    type: Date,
    default: null
  },
  // Backup and versioning
  versions: [{
    format: String,
    size: Number,
    path: String,
    cloudflareKey: String,
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

// Indexes for performance
imageSchema.index({ user: 1, tenant: 1, visibility: 1 });
imageSchema.index({ project: 1, visibility: 1 });
imageSchema.index({ visibility: 1, publicationDate: -1 });
imageSchema.index({ tenant: 1, visibility: 1, createdAt: -1 });
imageSchema.index({ tags: 1 });
imageSchema.index({ cloudflareKey: 1 });
imageSchema.index({ collections: 1 }); // Index for new collections array

// Virtual for public access URL
imageSchema.virtual('accessUrl').get(function() {
  if (this.visibility === 'public' && this.cloudflareUrl) {
    return this.cloudflareUrl;
  }
  return this.fileUrl;
});

// Ensure virtual fields are serialized
imageSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Image', imageSchema);