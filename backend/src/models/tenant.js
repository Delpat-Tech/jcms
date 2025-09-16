// models/tenant.js
const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  subdomain: { type: String, required: true, unique: true, trim: true },
  adminUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  settings: {
    maxUsers: { type: Number, default: 50 },
    maxStorage: { type: String, default: '10GB' },
    allowedFormats: { type: [String], default: ['pdf', 'jpg', 'png', 'docx'] }
  },
  branding: {
    logo: {
      url: { type: String, default: '' },
      filename: { type: String, default: '' },
      uploadedAt: { type: Date }
    },
    favicon: {
      url: { type: String, default: '' },
      filename: { type: String, default: '' },
      uploadedAt: { type: Date }
    },
    colors: {
      primary: { type: String, default: '#3b82f6' }, // Blue
      secondary: { type: String, default: '#64748b' }, // Slate
      accent: { type: String, default: '#10b981' }, // Emerald
      background: { type: String, default: '#ffffff' }, // White
      surface: { type: String, default: '#f8fafc' }, // Light gray
      text: {
        primary: { type: String, default: '#1e293b' }, // Dark slate
        secondary: { type: String, default: '#64748b' } // Medium slate
      }
    },
    typography: {
      fontFamily: { type: String, default: 'Inter, system-ui, sans-serif' },
      fontSize: {
        small: { type: String, default: '14px' },
        medium: { type: String, default: '16px' },
        large: { type: String, default: '18px' }
      }
    },
    theme: {
      mode: { type: String, enum: ['light', 'dark', 'auto'], default: 'light' },
      borderRadius: { type: String, default: '8px' },
      shadowIntensity: { type: String, enum: ['none', 'light', 'medium', 'strong'], default: 'medium' }
    },
    customCSS: { type: String, default: '' },
    companyInfo: {
      tagline: { type: String, default: '' },
      website: { type: String, default: '' },
      supportEmail: { type: String, default: '' },
      phone: { type: String, default: '' }
    }
  },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Tenant', tenantSchema);