const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  siteTitle: {
    type: String,
    default: 'JCMS - Content Management System'
  },
  siteTagline: {
    type: String,
    default: 'Manage your content with ease'
  },
  siteDescription: {
    type: String,
    default: 'A powerful content management system for modern web applications'
  },
  defaultLanguage: {
    type: String,
    default: 'en'
  },
  timezone: {
    type: String,
    default: 'UTC'
  },
  dateFormat: {
    type: String,
    default: 'YYYY-MM-DD'
  },
  timeFormat: {
    type: String,
    default: '24h'
  },
  logo: {
    type: String,
    default: ''
  },
  favicon: {
    type: String,
    default: ''
  },
  primaryColor: {
    type: String,
    default: '#3B82F6'
  },
  secondaryColor: {
    type: String,
    default: '#6B7280'
  },
  multiSiteEnabled: {
    type: Boolean,
    default: true
  },
  subdomainSupport: {
    type: Boolean,
    default: true
  },
  darkModeEnabled: {
    type: Boolean,
    default: false
  },
  darkModePrimaryColor: {
    type: String,
    default: '#1F2937'
  },
  darkModeSecondaryColor: {
    type: String,
    default: '#374151'
  }
}, {
  timestamps: true
});

// Ensure only one settings document exists
settingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

module.exports = mongoose.model('Settings', settingsSchema);