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
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Tenant', tenantSchema);