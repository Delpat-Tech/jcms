// models/notification.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['user_activity', 'system_alert', 'security_event']
  },
  action: {
    type: String,
    required: true
  },
  resource: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true
  },
  userRole: {
    type: String,
    required: true
  },
  resourceId: String,
  details: {
    method: String,
    path: String,
    ip: String,
    userAgent: String
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readBy: [{
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);