// services/notificationAggregator.js
const logger = require('../config/logger');
const config = require('../config/notificationConfig');
const ActivityLog = require('../models/activityLog');

class NotificationAggregator {
  constructor() {
    this.userActivity = new Map(); // Track per-user activity
    this.userCooldowns = new Map(); // Track cooldown periods per user
    this.threshold = config.aggregation.threshold;
    this.timeWindow = config.aggregation.timeWindow;
    this.activityThreshold = config.aggregation.activityThreshold || 25;
    this.resetInterval = config.aggregation.resetInterval || 1800000;
    this.cooldownPeriod = config.aggregation.cooldownPeriod || 300000;

    // Normal batching config and storage
    this.batches = new Map();
    this.batchCfg = (config.aggregation && config.aggregation.normalBatching) || {
      threshold: 3,
      batchWindowMs: 120000,
      debounceMs: 15000,
      includeTenant: true
    };

    this.startResetTimer();
  }

  async addNotification(notification) {
    // Always log to database first
    await this.logActivity(notification);

    // SEND ALL NOTIFICATIONS IMMEDIATELY - NO FILTERING
    console.log('📢 SENDING NOTIFICATION:', notification.action, 'by', notification.data.username);
    this.sendNotification(notification);

    // Also enqueue for server-side aggregation (batching)
    this.enqueueForAggregation(notification);
    
    // Track user activity for high-activity alerts
    const userId = notification.data.userId.toString();
    const currentCount = this.userActivity.get(userId) || 0;
    const newCount = currentCount + 1;
    this.userActivity.set(userId, newCount);
    
    // Send high activity alert at threshold
    if (newCount >= this.activityThreshold) {
      console.log(`🚨 High activity detected: ${notification.data.username}`);
      await this.sendActivityAlert(userId, notification.data.username, newCount);
      this.userActivity.set(userId, 0);
    }
  }

  async logActivity(notification) {
    try {
      const activityDoc = {
        action: notification.action,
        resource: notification.data.resource,
        userId: notification.data.userId,
        username: notification.data.username,
        userRole: notification.data.userRole,
        resourceId: notification.data.resourceId,
        details: notification.data.details
      };

      const activityLog = await ActivityLog.create(activityDoc);
      logger.debug('Activity logged to database', { 
        id: activityLog._id, 
        action: notification.action, 
        user: notification.data.username 
      });

      // Mirror into per-user-per-operation collection (logical "folders")
      try {
        const mongoose = require('mongoose');
        const collectionName = `activity_${notification.data.userId}_${notification.action}`;
        const DynamicModel = mongoose.model(collectionName, new mongoose.Schema({}, { strict: false }), collectionName);
        await DynamicModel.create({ ...activityDoc, createdAt: new Date() });
      } catch (mirrorError) {
        logger.warn('Mirroring to per-user collection failed', { error: mirrorError.message });
      }
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

  enqueueForAggregation(notification) {
    try {
      const { threshold, batchWindowMs, debounceMs, includeTenant } = this.batchCfg;
      const userId = notification?.data?.userId?.toString?.();
      const username = notification?.data?.username || 'Unknown';
      const action = notification?.action;
      const resource = notification?.data?.resource || 'Resource';
      const tenantId = includeTenant ? (notification?.data?.tenantId || notification?.data?.tenant?._id || null) : null;
      if (!userId || !action) return;

      const key = [userId, action, resource, tenantId || 'none'].join('|');
      const now = Date.now();
      let entry = this.batches.get(key);
      if (!entry) {
        entry = {
          meta: { userId, username, action, resource, tenantId },
          count: 0,
          firstAt: now,
          lastAt: now,
          breakdown: { format: new Map(), fileType: new Map(), resourceId: new Map() },
          resourceIds: new Set(),
          timers: { debounce: null, window: null }
        };
        // Hard window timeout to flush
        entry.timers.window = setTimeout(() => this.flushBatch(key), batchWindowMs);
        this.batches.set(key, entry);
      }

      // Update entry
      entry.count += 1;
      entry.lastAt = now;
      const d = notification?.data?.details || {};
      if (d.format) entry.breakdown.format.set(d.format, (entry.breakdown.format.get(d.format) || 0) + 1);
      if (d.fileType) entry.breakdown.fileType.set(d.fileType, (entry.breakdown.fileType.get(d.fileType) || 0) + 1);
      const rid = notification?.data?.resourceId;
      if (rid) {
        entry.resourceIds.add(rid);
        entry.breakdown.resourceId.set(rid, (entry.breakdown.resourceId.get(rid) || 0) + 1);
      }

      // Reset debounce timer
      if (entry.timers.debounce) clearTimeout(entry.timers.debounce);
      entry.timers.debounce = setTimeout(() => this.flushBatch(key), debounceMs);

      // Optional: if threshold reached early, we still wait for debounce to capture trailing ops
      // But we could emit immediately if count is extremely large.
    } catch (e) {
      logger.warn('enqueueForAggregation failed', { error: e.message });
    }
  }

  flushBatch(key) {
    const entry = this.batches.get(key);
    if (!entry) return;
    const { meta, count, firstAt, lastAt, breakdown } = entry;
    const timeframeMs = Math.max(0, lastAt - firstAt);

    // Respect threshold: only emit if count >= configured threshold
    const min = this.batchCfg?.threshold || 3;
    if (count < min) {
      // Cleanup timers and entry and skip emit
      if (entry.timers.debounce) clearTimeout(entry.timers.debounce);
      if (entry.timers.window) clearTimeout(entry.timers.window);
      this.batches.delete(key);
      return;
    }

    // Build summary from breakdown (prefer format/fileType if present)
    const summarize = (map) => Array.from(map.entries()).map(([k, v]) => ({ key: k, count: v }));
    let summary = [];
    if (breakdown.format.size > 0) summary = summarize(breakdown.format).map(x => ({ action: meta.action, resource: meta.resource, kind: 'format', name: x.key, count: x.count }));
    else if (breakdown.fileType.size > 0) summary = summarize(breakdown.fileType).map(x => ({ action: meta.action, resource: meta.resource, kind: 'fileType', name: x.key, count: x.count }));
    else summary = [{ action: meta.action, resource: meta.resource, count }];

    const notif = {
      action: 'aggregated_notification',
      timestamp: new Date(),
      data: {
        originalAction: meta.action,
        username: meta.username,
        userId: meta.userId,
        resource: meta.resource,
        tenantId: meta.tenantId,
        totalOperations: count,
        timeframeMs,
        timeframe: `${Math.round(timeframeMs / 1000)}s`,
        summary,
        sampleResourceIds: Array.from(entry.resourceIds).slice(0, 10)
      },
      message: `${meta.username} performed ${count} ${meta.action} on ${meta.resource} in ${Math.max(1, Math.round(timeframeMs/1000))}s`
    };

    if (global.io) {
      global.io.emit('aggregated_notification', notif);
      console.log('📦 Emitted aggregated_notification:', notif.data.originalAction, 'count=', notif.data.totalOperations, 'user=', notif.data.username);
    }

    // Cleanup timers and entry
    if (entry.timers.debounce) clearTimeout(entry.timers.debounce);
    if (entry.timers.window) clearTimeout(entry.timers.window);
    this.batches.delete(key);
  }

  startResetTimer() {
    setInterval(() => {
      console.log(`🔄 Resetting activity counters (had ${this.userActivity.size} users)`);
      this.userActivity.clear();
      this.userCooldowns.clear(); // Also clear cooldowns
    }, this.resetInterval);
  }

  // Helper methods for less annoying notifications
  isCritical(action) {
    return config.priorities.critical.includes(action);
  }

  getPriority(action) {
    if (config.priorities.critical.includes(action)) return 'critical';
    if (config.priorities.high.includes(action)) return 'high';
    if (config.priorities.medium.includes(action)) return 'medium';
    return 'low';
  }

  isQuietHours() {
    if (!config.quietHours.enabled) return false;
    
    const now = new Date();
    const currentTime = now.getHours() * 100 + now.getMinutes();
    const startTime = this.parseTime(config.quietHours.start);
    const endTime = this.parseTime(config.quietHours.end);
    
    // Handle overnight quiet hours (e.g., 22:00 to 08:00)
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime <= endTime;
    }
    return currentTime >= startTime && currentTime <= endTime;
  }

  parseTime(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 100 + minutes;
  }

  isInCooldown(userId) {
    const cooldownEnd = this.userCooldowns.get(userId);
    return cooldownEnd && Date.now() < cooldownEnd;
  }

  setCooldown(userId) {
    this.userCooldowns.set(userId, Date.now() + this.cooldownPeriod);
  }

  sendNotification(notification) {
    // Add message field if missing
    if (!notification.message) {
      notification.message = `${notification.data.username} performed ${notification.action} on ${notification.data.resource}`;
    }
    
    // Add timestamp if missing
    if (!notification.timestamp) {
      notification.timestamp = new Date();
    }
    
    // Send notification via WebSocket
    if (global.io) {
      global.io.emit('admin_notification', notification);
      console.log(`✅ Alert sent to ${global.io.engine.clientsCount} clients`);
    } else {
      console.log('❌ No WebSocket connection available');
    }
  }
}

module.exports = new NotificationAggregator();