// config/notificationConfig.js
module.exports = {
  aggregation: {
    activityThreshold: parseInt(process.env.ACTIVITY_THRESHOLD) || 3, // Alert after 3 operations for testing
    timeWindow: parseInt(process.env.ACTIVITY_TIME_WINDOW) || 300000, // 5 minutes
    resetInterval: parseInt(process.env.RESET_INTERVAL) || 300000 // Reset counters every 5 minutes
  },
  
  priorities: {
    high: ['user_delete', 'security_event', 'system_alert'],
    medium: ['user_create', 'user_update', 'image_delete'],
    low: ['image_upload', 'image_update', 'login']
  },
  
  // High priority notifications bypass activity tracking
  bypassAggregation: ['security_event', 'system_alert', 'user_delete']
};