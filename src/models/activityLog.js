// models/activityLog.js
const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  action: { type: String, required: true },
  resource: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  username: { type: String, required: true },
  userRole: { type: String, required: true },
  resourceId: String,
  details: {
    method: String,
    path: String,
    ip: String,
    userAgent: String
  },
  isNotified: { type: Boolean, default: false }
}, { timestamps: true });

// Index for efficient querying
activityLogSchema.index({ userId: 1, createdAt: -1 });
activityLogSchema.index({ action: 1, createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);