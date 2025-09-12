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

// Indexes for efficient querying
// Existing indexes
activityLogSchema.index({ userId: 1, createdAt: -1 });
activityLogSchema.index({ action: 1, createdAt: -1 });

// Additional helpful indexes for time-bucket summaries and high-activity lookups
activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ username: 1, createdAt: -1 });
activityLogSchema.index({ resource: 1, createdAt: -1 });
activityLogSchema.index({ userId: 1, action: 1, createdAt: -1 });
activityLogSchema.index({ action: 1, resource: 1, createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);