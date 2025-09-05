// controllers/notificationController.js
const Notification = require('../models/notification');

// Get unread notifications for admin
const getUnreadNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ isRead: false })
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json({
      success: true,
      count: notifications.length,
      data: notifications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications',
      error: error.message
    });
  }
};

// Mark notification as read
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    
    await Notification.findByIdAndUpdate(id, {
      isRead: true,
      $push: {
        readBy: {
          adminId: req.user.id,
          readAt: new Date()
        }
      }
    });
    
    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error marking notification as read',
      error: error.message
    });
  }
};

// Get notification statistics
const getNotificationStats = async (req, res) => {
  try {
    const totalCount = await Notification.countDocuments();
    const unreadCount = await Notification.countDocuments({ isRead: false });
    const todayCount = await Notification.countDocuments({
      createdAt: { $gte: new Date().setHours(0, 0, 0, 0) }
    });
    
    res.json({
      success: true,
      data: {
        total: totalCount,
        unread: unreadCount,
        today: todayCount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching notification stats',
      error: error.message
    });
  }
};

module.exports = {
  getUnreadNotifications,
  markAsRead,
  getNotificationStats
};