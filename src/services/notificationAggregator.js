// services/notificationAggregator.js
const logger = require('../config/logger');
const config = require('../config/notificationConfig');
const ActivityLog = require('../models/activityLog');

class NotificationAggregator {
  constructor() {
    this.userActivity = new Map(); // Track per-user activity
    this.threshold = config.aggregation.threshold;
    this.timeWindow = config.aggregation.timeWindow;
    this.activityThreshold = config.aggregation.activityThreshold || 10;
    this.resetInterval = config.aggregation.resetInterval || 300000;
    this.startResetTimer();
  }

  async addNotification(notification) {
    // Always log to database first
    await this.logActivity(notification);

    // High priority notifications bypass aggregation
    if (config.bypassAggregation.includes(notification.action)) {
      this.sendNotification(notification);
      return;
    }

    // Track user activity count
    const userId = notification.data.userId.toString(); // Ensure string key
    const currentCount = this.userActivity.get(userId) || 0;
    const newCount = currentCount + 1;
    this.userActivity.set(userId, newCount);
    
    console.log(`🔍 DEBUG: userId=${userId}, currentCount=${currentCount}, newCount=${newCount}, mapSize=${this.userActivity.size}`);

    // Debug logging
    console.log(`🔥 ACTIVITY TRACKED: ${notification.data.username} - ${notification.action} (${newCount}/${this.activityThreshold})`);
    
    // Only notify if user exceeds activity threshold
    if (newCount >= this.activityThreshold) {
      console.log(`🚨 THRESHOLD EXCEEDED! Sending alert for ${notification.data.username}`);
      await this.sendActivityAlert(userId, notification.data.username, newCount);
      this.userActivity.set(userId, 0); // Reset counter
    }
  }

  async logActivity(notification) {
    try {
      const activityLog = await ActivityLog.create({
        action: notification.action,
        resource: notification.data.resource,
        userId: notification.data.userId,
        username: notification.data.username,
        userRole: notification.data.userRole,
        resourceId: notification.data.resourceId,
        details: notification.data.details
      });
      logger.debug('Activity logged to database', { 
        id: activityLog._id, 
        action: notification.action, 
        user: notification.data.username 
      });
    } catch (error) {
      logger.error('Failed to log activity', { error: error.message, stack: error.stack });
    }
  }

  async sendActivityAlert(userId, username, count) {
    // Get recent activities for this user
    const recentActivities = await ActivityLog.find({ userId })
      .sort({ createdAt: -1 })
      .limit(count);

    const grouped = this.groupActivities(recentActivities);
    
    // Calculate exact time duration
    const firstActivity = recentActivities[recentActivities.length - 1];
    const lastActivity = recentActivities[0];
    const durationMs = lastActivity.createdAt - firstActivity.createdAt;
    const durationSeconds = Math.round(durationMs / 1000);
    
    let timeframe;
    if (durationSeconds < 60) {
      timeframe = `${durationSeconds} seconds`;
    } else {
      const minutes = Math.floor(durationSeconds / 60);
      const seconds = durationSeconds % 60;
      timeframe = seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes} minutes`;
    }
    
    const alertNotification = {
      action: 'high_activity_alert',
      timestamp: new Date(),
      data: {
        username,
        userId,
        totalOperations: count,
        summary: grouped,
        timeframe,
        exactDuration: {
          milliseconds: durationMs,
          seconds: durationSeconds,
          formatted: timeframe
        }
      }
    };

    this.sendNotification(alertNotification);
    
    // Mark activities as notified
    await ActivityLog.updateMany(
      { _id: { $in: recentActivities.map(a => a._id) } },
      { isNotified: true }
    );
  }

  groupActivities(activities) {
    return activities.reduce((groups, activity) => {
      const key = `${activity.action}_${activity.resource}`;
      if (!groups[key]) {
        groups[key] = { action: activity.action, resource: activity.resource, count: 0 };
      }
      groups[key].count++;
      return groups;
    }, {});
  }

  startResetTimer() {
    setInterval(() => {
      console.log(`🔄 Resetting activity counters (had ${this.userActivity.size} users)`);
      this.userActivity.clear();
    }, this.resetInterval);
  }

  sendNotification(notification) {
    console.log(`📢 SENDING ALERT:`, notification);
    
    if (global.io) {
      global.io.emit('admin_notification', notification);
      console.log(`✅ Alert sent to ${global.io.engine.clientsCount} clients`);
    } else {
      console.log('❌ No WebSocket connection available');
    }
  }
}

module.exports = new NotificationAggregator();