// controllers/notificationController.js
const Notification = require('../models/notification');
const logger = require('../config/logger');

const getNotifications = async (req, res) => {
  try {
    const {
      type,
      action,
      resource,
      userRole,
      username,
      startDate,
      endDate,
      isRead,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (type) filter.type = type;
    if (action) filter.action = new RegExp(action, 'i');
    if (resource) filter.resource = new RegExp(resource, 'i');
    if (userRole) filter.userRole = userRole;
    if (username) filter.username = new RegExp(username, 'i');
    if (isRead !== undefined) filter.isRead = isRead === 'true';
    
    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Pagination
    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const notifications = await Notification.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'username email');

    const total = await Notification.countDocuments(filter);

    res.json({
      success: true,
      data: notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      filters: req.query
    });
  } catch (error) {
    logger.error('Error fetching notifications', { error: error.message });
    res.status(500).json({ success: false, message: 'Error fetching notifications' });
  }
};

const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    const notification = await Notification.findByIdAndUpdate(
      id,
      {
        isRead: true,
        $addToSet: {
          readBy: { adminId, readAt: new Date() }
        }
      },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.json({ success: true, data: notification });
  } catch (error) {
    logger.error('Error marking notification as read', { error: error.message });
    res.status(500).json({ success: false, message: 'Error updating notification' });
  }
};

const getUnreadNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ isRead: false })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('userId', 'username email');

    res.json({ success: true, data: notifications });
  } catch (error) {
    logger.error('Error fetching unread notifications', { error: error.message });
    res.status(500).json({ success: false, message: 'Error fetching notifications' });
  }
};

const getNotificationStats = async (req, res) => {
  try {
    const stats = await Notification.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          unread: { $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] } }
        }
      }
    ]);

    res.json({ success: true, data: stats[0] || { total: 0, unread: 0 } });
  } catch (error) {
    logger.error('Error fetching notification stats', { error: error.message });
    res.status(500).json({ success: false, message: 'Error fetching stats' });
  }
};

const getFilterOptions = async (req, res) => {
  try {
    const [types, actions, resources, userRoles] = await Promise.all([
      Notification.distinct('type'),
      Notification.distinct('action'),
      Notification.distinct('resource'),
      Notification.distinct('userRole')
    ]);

    res.json({
      success: true,
      filterOptions: {
        types,
        actions,
        resources,
        userRoles
      }
    });
  } catch (error) {
    logger.error('Error fetching filter options', { error: error.message });
    res.status(500).json({ success: false, message: 'Error fetching filter options' });
  }
};

// Get user-specific operations from folder-like collections
const getUserOperations = async (req, res) => {
  try {
    const { userId, operation } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const mongoose = require('mongoose');
    const collectionName = `activity_${userId}_${operation}`;
    
    // Check if collection exists
    const collections = await mongoose.connection.db.listCollections({ name: collectionName }).toArray();
    if (collections.length === 0) {
      return res.json({
        success: true,
        data: [],
        message: 'No operations found for this user and action type',
        pagination: { page: 1, limit, total: 0, pages: 0 }
      });
    }
    
    const DynamicModel = mongoose.model(collectionName, new mongoose.Schema({}, { strict: false }), collectionName);
    
    const skip = (page - 1) * limit;
    const operations = await DynamicModel.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
      
    const total = await DynamicModel.countDocuments({});
    
    res.json({
      success: true,
      data: operations,
      userFolder: `${userId}/${operation}`,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching user operations', { error: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: 'Error fetching user operations' });
  }
};

// Get all available user folders (collections)
const getUserFolders = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    const userFolders = collections
      .map(col => col.name)
      .filter(name => name.startsWith('activity_'))
      .map(name => {
        const parts = name.replace('activity_', '').split('_');
        const userId = parts[0];
        const operation = parts.slice(1).join('_');
        return { userId, operation, collection: name };
      })
      .reduce((acc, folder) => {
        if (!acc[folder.userId]) {
          acc[folder.userId] = [];
        }
        acc[folder.userId].push({ operation: folder.operation, collection: folder.collection });
        return acc;
      }, {});
    
    res.json({
      success: true,
      userFolders,
      totalUsers: Object.keys(userFolders).length,
      totalFolders: collections.filter(col => col.name.startsWith('activity_')).length
    });
  } catch (error) {
    logger.error('Error fetching user folders', { error: error.message });
    res.status(500).json({ success: false, message: 'Error fetching user folders' });
  }
};

// Get aggregated notification summary for dashboard
const getAggregatedSummary = async (req, res) => {
  try {
    const { hours = 24 } = req.query;
    const startTime = new Date(Date.now() - (hours * 60 * 60 * 1000));
    
    const ActivityLog = require('../models/activityLog');
    
    const aggregation = await ActivityLog.aggregate([
      { $match: { createdAt: { $gte: startTime } } },
      {
        $group: {
          _id: {
            action: '$action',
            username: '$username',
            resource: '$resource'
          },
          count: { $sum: 1 },
          firstSeen: { $min: '$createdAt' },
          lastSeen: { $max: '$createdAt' },
          resourceIds: { $addToSet: '$resourceId' }
        }
      },
      { $match: { count: { $gte: 3 } } }, // Only groups with 3+ similar operations
      { $sort: { count: -1, lastSeen: -1 } },
      { $limit: 50 }
    ]);
    
    res.json({
      success: true,
      data: aggregation.map(item => ({
        action: item._id.action,
        username: item._id.username,
        resource: item._id.resource,
        count: item.count,
        timeSpan: Math.round((item.lastSeen - item.firstSeen) / 1000 / 60), // minutes
        resourceIds: item.resourceIds,
        firstSeen: item.firstSeen,
        lastSeen: item.lastSeen
      })),
      timeRange: `${hours} hours`,
      generatedAt: new Date()
    });
  } catch (error) {
    logger.error('Error fetching aggregated summary', { error: error.message });
    res.status(500).json({ success: false, message: 'Error fetching aggregated summary' });
  }
};

module.exports = {
  getNotifications,
  getUnreadNotifications,
  getNotificationStats,
  markAsRead,
  getFilterOptions,
  getUserOperations,
  getUserFolders,
  getAggregatedSummary
};
