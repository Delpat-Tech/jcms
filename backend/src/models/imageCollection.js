// models/imageCollection.js
const mongoose = require('mongoose');

const imageCollectionSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
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
  tenantName: {
    type: String,
    default: 'system'
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content',
    default: null
  },
  coverImage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Image',
    default: null
  },
  visibility: {
    type: String,
    enum: ['private', 'public'],
    default: 'public'
  },
  tags: [{
    type: String,
    trim: true
  }],
  settings: {
    allowPublicAccess: { type: Boolean, default: false },
    downloadEnabled: { type: Boolean, default: true },
    watermarkEnabled: { type: Boolean, default: false }
  },
  stats: {
    totalImages: { type: Number, default: 0 },
    totalSize: { type: Number, default: 0 },
    publicImages: { type: Number, default: 0 },
    privateImages: { type: Number, default: 0 }
  },
  publicationDate: {
    type: Date,
    default: null
  },
  cloudflareFolder: {
    type: String, // R2 folder path for this collection
    default: null
  }
}, { timestamps: true });

// Indexes
imageCollectionSchema.index({ user: 1, tenant: 1, visibility: 1 });
// imageCollectionSchema.index({ slug: 1 }); // <-- This line is removed to fix the duplicate index warning
imageCollectionSchema.index({ tenant: 1, visibility: 1, createdAt: -1 });
imageCollectionSchema.index({ tags: 1 });

// Virtual for image count
imageCollectionSchema.virtual('imageCount', {
  ref: 'Image',
  localField: '_id',
  foreignField: 'collection',
  count: true
});

// Virtual for public URL
imageCollectionSchema.virtual('publicUrl').get(function() {
  if (this.visibility === 'public' && this.cloudflareFolder) {
    return `${process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN || 'https://your-domain.com'}/collections/${this.slug}`;
  }
  return null;
});

// Ensure virtual fields are serialized
imageCollectionSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('ImageCollection', imageCollectionSchema);