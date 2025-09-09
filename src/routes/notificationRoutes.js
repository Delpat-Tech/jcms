// routes/notificationRoutes.js
const express = require('express');
const { authenticate, requireAdminOrAbove } = require('../middlewares/auth');
const {
  getNotifications,
  getUnreadNotifications,
  getNotificationStats,
  markAsRead,
  getFilterOptions
} = require('../controllers/notificationController');

const router = express.Router();

// All routes require admin authentication
router.use(authenticate, requireAdminOrAbove);

router.get('/', getNotifications);
router.get('/unread', getUnreadNotifications);
router.get('/stats', getNotificationStats);
router.get('/filter-options', getFilterOptions);
router.patch('/:id/read', markAsRead);

module.exports = router;