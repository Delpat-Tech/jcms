// config/notificationConfig.js
module.exports = {
  // Notification system settings (Less annoying configuration)
  notifications: {
    enabled: process.env.NOTIFICATIONS_ENABLED !== 'false', // Can disable entirely
    quietMode: process.env.QUIET_MODE === 'true', // Minimal notifications
    criticalOnly: process.env.CRITICAL_ONLY === 'true' // Only critical events
  },
  
  aggregation: {
    activityThreshold: parseInt(process.env.ACTIVITY_THRESHOLD) || 25, // Increased from 3 to 25
    timeWindow: parseInt(process.env.ACTIVITY_TIME_WINDOW) || 900000, // Increased to 15 minutes
    resetInterval: parseInt(process.env.RESET_INTERVAL) || 1800000, // Reset every 30 minutes
    cooldownPeriod: parseInt(process.env.COOLDOWN_PERIOD) || 300000 // 5 min cooldown between same user alerts
  },
  
  priorities: {
    // Only truly critical events
    critical: ['security_event', 'system_alert', 'user_delete', 'admin_login_failure'],
    // Important but not urgent
    high: ['user_create', 'role_change', 'tenant_create'],
    // Normal operations - heavily filtered
    medium: ['user_update', 'image_delete', 'bulk_operation'],
    // Mostly ignored unless in bulk
    low: ['image_upload', 'image_update', 'login', 'file_upload', 'profile_update']
  },
  
  // Events that bypass aggregation (immediate alerts)
  bypassAggregation: ['security_event', 'system_alert'],
  
  // Events to completely ignore in production
  ignored: process.env.NODE_ENV === 'production' ? 
    ['login', 'profile_update', 'image_upload', 'file_upload'] : [],
  
  // Quiet hours - no notifications except critical
  quietHours: {
    enabled: process.env.QUIET_HOURS_ENABLED === 'true',
    start: process.env.QUIET_START || '22:00', // 10 PM
    end: process.env.QUIET_END || '08:00'     // 8 AM
  }
};
