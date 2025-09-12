// config/notificationConfig.js
module.exports = {
  // Notification system settings (Less annoying configuration)
  notifications: {
    enabled: process.env.NOTIFICATIONS_ENABLED !== 'false', // Can disable entirely
    quietMode: process.env.QUIET_MODE === 'true', // Minimal notifications
    criticalOnly: process.env.CRITICAL_ONLY === 'true' // Only critical events
  },
  
  aggregation: {
    activityThreshold: parseInt(process.env.ACTIVITY_THRESHOLD) || 3, // Reduced to 3 for testing
    timeWindow: parseInt(process.env.ACTIVITY_TIME_WINDOW) || 60000, // Reduced to 1 minute for testing
    resetInterval: parseInt(process.env.RESET_INTERVAL) || 300000, // Reset every 5 minutes for testing
    cooldownPeriod: parseInt(process.env.COOLDOWN_PERIOD) || 30000, // 30 seconds cooldown for testing
    
    // Time bucket configuration
    timeBuckets: {
      enabled: process.env.TIME_BUCKETS_ENABLED !== 'false', // Enable by default; set to 'false' to disable
      hourlyThreshold: parseInt(process.env.HOURLY_THRESHOLD) || 1, // Reduced to 1 for testing
      dailyThreshold: parseInt(process.env.DAILY_THRESHOLD) || 3, // Reduced to 3 for testing
      cleanupInterval: parseInt(process.env.BUCKET_CLEANUP_INTERVAL) || 300000, // Clean up every 5 minutes for testing
      retentionHours: parseInt(process.env.BUCKET_RETENTION_HOURS) || 1, // Keep hourly buckets for 1 hour for testing
      retentionDays: parseInt(process.env.BUCKET_RETENTION_DAYS) || 1, // Keep daily buckets for 1 day for testing
      timeThreshold: parseInt(process.env.BUCKET_TIME_THRESHOLD) || 180000 // Emit summary after 3 minutes even if threshold not met
    }
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
  
  // Events to completely ignore in production - disabled for testing
  ignored: [],
  
  // Quiet hours - disabled for testing
  quietHours: {
    enabled: false,
    start: process.env.QUIET_START || '22:00', // 10 PM
    end: process.env.QUIET_END || '08:00'     // 8 AM
  }
};
