// src/routes/adminRoutes.js
const express = require('express');
const {
  getDashboard,
  getStats
} = require('../controllers/adminController');
const { authenticate, requireAdminOrAbove } = require('../middlewares/auth');
const router = express.Router();

// All routes require authentication and admin role or above
router.use(authenticate, requireAdminOrAbove);

// Dashboard routes
router.get('/dashboard', getDashboard);
router.get('/stats', getStats);

// User management has been moved to unified /api/users routes
// Image management moved to unified /api/admin-images

module.exports = router;