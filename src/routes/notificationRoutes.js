// routes/notificationRoutes.js
const express = require('express');
const { authenticate, requireAdminOrAbove } = require('../middlewares/auth');
const {
  getUnreadNotifications,
  markAsRead,
  getNotificationStats
} = require('../controllers/notificationController');

const router = express.Router();

// All routes require admin authentication
router.use(authenticate, requireAdminOrAbove);

router.get('/unread', getUnreadNotifications);
router.get('/stats', getNotificationStats);
router.patch('/:id/read', markAsRead);

module.exports = router;