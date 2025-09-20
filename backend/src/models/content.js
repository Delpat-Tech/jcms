// models/content.js
const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true
  },
  excerpt: {
    type: String,
    trim: true,
    maxlength: 500
  },
  type: {
    type: String,
    enum: ['article', 'page', 'template'],
    default: 'article'
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'scheduled'],
    default: 'draft'
  },
  tags: [{
    type: String,
    trim: true
  }],
  coverImageUrl: {
    type: String,
    trim: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant'
  },
  publishedAt: {
    type: Date
  },
  scheduledAt: {
    type: Date
  },
  deleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  // SEO fields
  metaTitle: {
    type: String,
    trim: true,
    maxlength: 60
  },
  metaDescription: {
    type: String,
    trim: true,
    maxlength: 160
  },
  slug: {
    type: String,
    trim: true,
    lowercase: true
  },
  // Analytics
  views: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  }
}, {
  timestamps: false // We're handling timestamps manually
});

// Indexes for performance
contentSchema.index({ author: 1, tenant: 1, status: 1 });
contentSchema.index({ status: 1, publishedAt: -1 });
contentSchema.index({ tenant: 1, deleted: 1 });
contentSchema.index({ title: 'text', content: 'text', excerpt: 'text' });

// Virtual for URL (can be customized based on your routing needs)
contentSchema.virtual('url').get(function() {
  if (this.status === 'published') {
    return `/content/${this.slug || this._id}`;
  }
  return null;
});

// Ensure virtual fields are serialized
contentSchema.set('toJSON', { virtuals: true });

const Content = mongoose.model('Content', contentSchema);

module.exports = Content;