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

module.exports = {
  getNotifications,
  getUnreadNotifications,
  getNotificationStats,
  markAsRead,
  getFilterOptions
};