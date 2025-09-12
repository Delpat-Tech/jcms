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
      threshold: 2,         // Reduced from 3 for testing
      batchWindowMs: 30000, // Reduced from 120000 (2 min) to 30 sec for testing
      debounceMs: 5000,     // Reduced from 15000 to 5000 for testing
      includeTenant: true
    };
    
    // Time bucket aggregation storage
    this.timeBuckets = {
      hourly: new Map(),  // Hourly buckets
      daily: new Map()    // Daily buckets
    };
    
    // Time bucket configuration from config
    this.timeBucketCfg = config.aggregation.timeBuckets || {
      enabled: true,       // Enable time-based bucketing
      hourlyThreshold: 5,  // Minimum notifications to show hourly summary
      dailyThreshold: 10,  // Minimum notifications to show daily summary
      cleanupInterval: 3600000 // Clean up old buckets every hour
    };

    this.startResetTimer();
    this.startTimeBucketCleanup();
  }

  async addNotification(notification) {
    // Always log to database first
    await this.logActivity(notification);

    // SEND ALL NOTIFICATIONS IMMEDIATELY - NO FILTERING
    console.log('📢 SENDING NOTIFICATION:', notification.action, 'by', notification.data.username);
    this.sendNotification(notification);

    // Also enqueue for server-side aggregation (batching)
    this.enqueueForAggregation(notification);
    
    // Add to time buckets for time-based aggregation
    this.addToTimeBuckets(notification);
    
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
  
  startTimeBucketCleanup() {
    if (!this.timeBucketCfg.enabled) return;
    
    // Set up interval to clean up old buckets
    setInterval(() => {
      const now = Date.now();
      const hourlyRetention = this.timeBucketCfg.retentionHours || 1;
      const dailyRetention = this.timeBucketCfg.retentionDays || 1;
      
      // Clean up hourly buckets older than retention period
      for (const [key, bucket] of this.timeBuckets.hourly.entries()) {
        const bucketTime = bucket.hour;
        const hourlyRetentionMs = hourlyRetention * 60 * 60 * 1000;
        if (now - bucketTime > hourlyRetentionMs) {
          this.timeBuckets.hourly.delete(key);
          console.log(`Cleaned up hourly bucket: ${key}`);
        }
      }
      
      // Clean up daily buckets older than retention period
      for (const [key, bucket] of this.timeBuckets.daily.entries()) {
        const bucketTime = bucket.day;
        const dailyRetentionMs = dailyRetention * 24 * 60 * 60 * 1000;
        if (now - bucketTime > dailyRetentionMs) {
          this.timeBuckets.daily.delete(key);
          console.log(`Cleaned up daily bucket: ${key}`);
        }
      }
      
      // Check for time-based emission of buckets
      this.checkTimeBuckets();
    }, this.timeBucketCfg.cleanupInterval || 3600000); // Default to 1 hour
    
    // Also set up a more frequent check for time-based emissions
    setInterval(() => {
      this.checkTimeBuckets();
    }, 60000); // Check every minute
  }
  
  // cleanupTimeBuckets method has been integrated directly into startTimeBucketCleanup
  // for better time-based emission handling

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
    
    // Determine appropriate event channel
    let eventName = 'admin_notification';
    if (notification.action === 'time_bucket_hourly') {
      eventName = 'time_bucket_hourly';
    } else if (notification.action === 'time_bucket_daily') {
      eventName = 'time_bucket_daily';
    } else if (notification.action === 'aggregated_notification') {
      eventName = 'aggregated_notification';
    }

    // Send notification via WebSocket
    if (global.io) {
      global.io.emit(eventName, notification);
      console.log(`✅ Emitted ${eventName} to ${global.io.engine.clientsCount} clients`);
    } else {
      console.log('❌ No WebSocket connection available');
    }
  }
  
  // Time bucket methods
  addToTimeBuckets(notification) {
    if (!this.timeBucketCfg.enabled) return;
    
    // Skip certain notification types that shouldn't be time-bucketed
    if (this.isCritical(notification.action)) return;
    if (notification.action === 'high_activity_alert') return;
    if (notification.action === 'aggregated_notification') return;
    
    const now = new Date();
    const hourKey = this.getHourBucketKey(notification, now);
    const dayKey = this.getDayBucketKey(notification, now);
    
    // Add to hourly bucket
    this.addToHourlyBucket(hourKey, notification, now);
    
    // Add to daily bucket
    this.addToDailyBucket(dayKey, notification, now);
    
    // Check for time-based emission of hourly buckets
    this.checkTimeBuckets();
  }
  
  checkTimeBuckets() {
    const now = Date.now();
    const timeThreshold = this.timeBucketCfg.timeThreshold || 180000; // Default 3 minutes
    
    // Check hourly buckets for time-based emission
    for (const [key, bucket] of this.timeBuckets.hourly.entries()) {
      // If bucket has at least one notification and has been active for longer than the threshold
      if (bucket.count >= 1 && (now - bucket.startTime) > timeThreshold) {
        console.log(`⏱️ Time threshold reached for ${key}: ${bucket.count} operations over ${((now - bucket.startTime)/60000).toFixed(1)} minutes`);
        this.emitHourlySummary(key, bucket);
      }
    }
  }
  
  getHourBucketKey(notification, date) {
    const hour = date.toISOString().substring(0, 13); // YYYY-MM-DDTHH format
    return `${hour}|${notification.action}`;
  }
  
  getDayBucketKey(notification, date) {
    const day = date.toISOString().substring(0, 10); // YYYY-MM-DD format
    return `${day}|${notification.action}`;
  }
  
  addToHourlyBucket(key, notification, now) {
    let bucket = this.timeBuckets.hourly.get(key);
    
    if (!bucket) {
      // Create new hourly bucket
      bucket = {
        action: notification.action,
        hour: new Date(now).setMinutes(0, 0, 0), // Start of the hour
        count: 0,
        users: new Map(),
        resources: new Map(),
        notifications: [],
        startTime: Date.now(), // Track when we started collecting
        lastUpdate: Date.now() // Track last update time
      };
      this.timeBuckets.hourly.set(key, bucket);
    }
    
    // Update bucket
    bucket.count++;
    bucket.lastUpdate = Date.now();
    bucket.notifications.push(notification);
    
    // Track users
    const userId = notification.data.userId.toString();
    const username = notification.data.username;
    if (!bucket.users.has(userId)) {
      bucket.users.set(userId, { username, count: 0 });
    }
    bucket.users.get(userId).count++;
    
    // Track resources
    const resource = notification.data.resource;
    if (!bucket.resources.has(resource)) {
      bucket.resources.set(resource, 0);
    }
    bucket.resources.set(resource, bucket.resources.get(resource) + 1);
    
    // Track resource IDs if available
    if (notification.data.resourceId) {
      if (!bucket.resourceIds) {
        bucket.resourceIds = new Map();
      }
      const resourceId = notification.data.resourceId.toString();
      if (!bucket.resourceIds.has(resourceId)) {
        bucket.resourceIds.set(resourceId, 0);
      }
      bucket.resourceIds.set(resourceId, bucket.resourceIds.get(resourceId) + 1);
    }
    
    // Check if we should emit hourly summary based on count threshold
    // Time-based threshold is handled by checkTimeBuckets method
    if (bucket.count >= this.timeBucketCfg.hourlyThreshold) {
      this.emitHourlySummary(key, bucket);
    }
  }
  
  addToDailyBucket(key, notification, now) {
    let bucket = this.timeBuckets.daily.get(key);
    
    if (!bucket) {
      // Create new daily bucket
      bucket = {
        action: notification.action,
        day: new Date(now).setHours(0, 0, 0, 0), // Start of the day
        count: 0,
        users: new Map(),
        resources: new Map(),
        hourly: new Map() // Track hourly distribution
      };
      this.timeBuckets.daily.set(key, bucket);
    }
    
    // Update bucket
    bucket.count++;
    
    // Track users
    const userId = notification.data.userId.toString();
    const username = notification.data.username;
    if (!bucket.users.has(userId)) {
      bucket.users.set(userId, { username, count: 0 });
    }
    bucket.users.get(userId).count++;
    
    // Track resources
    const resource = notification.data.resource;
    if (!bucket.resources.has(resource)) {
      bucket.resources.set(resource, 0);
    }
    bucket.resources.set(resource, bucket.resources.get(resource) + 1);
    
    // Track hourly distribution
    const hour = now.getHours();
    if (!bucket.hourly.has(hour)) {
      bucket.hourly.set(hour, 0);
    }
    bucket.hourly.set(hour, bucket.hourly.get(hour) + 1);
    
    // Check if we should emit daily summary
    if (bucket.count >= this.timeBucketCfg.dailyThreshold) {
      this.emitDailySummary(key, bucket);
    }
  }
  
  emitHourlySummary(key, bucket) {
    // Convert Maps to arrays for easier consumption by frontend
    const users = Array.from(bucket.users.entries())
      .map(([id, data]) => ({
        id,
        username: data.username,
        count: data.count
      }))
      .sort((a, b) => b.count - a.count); // Sort by count descending
    
    const resources = Array.from(bucket.resources.entries())
      .map(([name, count]) => ({
        name,
        count
      }))
      .sort((a, b) => b.count - a.count); // Sort by count descending
    
    // Calculate activity rate per minute
    const hourDate = new Date(bucket.hour);
    const hourFormatted = hourDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const activityDuration = (Date.now() - bucket.hour) / 60000; // in minutes
    const activityRate = activityDuration > 0 ? (bucket.count / activityDuration).toFixed(2) : bucket.count;
    
    // Group operations by type if details are available
    const operationTypes = new Map();
    bucket.notifications.forEach(notification => {
      const details = notification.data.details || {};
      const opType = details.operationType || details.fileType || details.format || 'unknown';
      if (!operationTypes.has(opType)) {
        operationTypes.set(opType, 0);
      }
      operationTypes.set(opType, operationTypes.get(opType) + 1);
    });
    
    const operationBreakdown = Array.from(operationTypes.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
    
    const notification = {
      action: 'time_bucket_hourly',
      timestamp: new Date(),
      data: {
        originalAction: bucket.action,
        hour: bucket.hour,
        hourFormatted,
        totalOperations: bucket.count,
        users,
        resources,
        activityRate,
        activityDuration: activityDuration.toFixed(1),
        operationBreakdown,
        sampleNotifications: bucket.notifications.slice(-5) // Last 5 notifications as samples
      },
      message: `Hourly Summary: ${bucket.count} ${bucket.action} operations at ${hourFormatted} (${activityRate} ops/min)`
    };
    
    this.sendNotification(notification);
    console.log(`⏱️ Emitted hourly summary for ${bucket.action}: ${bucket.count} operations (${activityRate} ops/min)`);
    
    // Reset the bucket to avoid duplicate summaries
    this.timeBuckets.hourly.delete(key);
  }
  
  emitDailySummary(key, bucket) {
    // Convert Maps to arrays for easier consumption by frontend
    const users = Array.from(bucket.users.entries())
      .map(([id, data]) => ({
        id,
        username: data.username,
        count: data.count
      }))
      .sort((a, b) => b.count - a.count) // Sort by count descending
      .slice(0, 10); // Top 10 users
    
    const resources = Array.from(bucket.resources.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count) // Sort by count descending
      .slice(0, 10); // Top 10 resources
    
    // Convert hourly distribution to array
    const hourlyDistribution = Array.from(bucket.hourly.entries())
      .map(([hour, count]) => ({ hour, count }))
      .sort((a, b) => a.hour - b.hour); // Sort by hour ascending
    
    const dayDate = new Date(bucket.day);
    const dayFormatted = dayDate.toLocaleDateString();
    
    const notification = {
      action: 'time_bucket_daily',
      timestamp: new Date(),
      data: {
        originalAction: bucket.action,
        day: bucket.day,
        dayFormatted,
        totalOperations: bucket.count,
        users,
        resources,
        hourlyDistribution
      },
      message: `Daily Summary: ${bucket.count} ${bucket.action} operations on ${dayFormatted}`
    };
    
    this.sendNotification(notification);
    console.log(`📅 Emitted daily summary for ${bucket.action}: ${bucket.count} operations`);
    
    // Reset the bucket to avoid duplicate summaries
    this.timeBuckets.daily.delete(key);
  }
}

module.exports = new NotificationAggregator();