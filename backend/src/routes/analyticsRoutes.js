// src/routes/analyticsRoutes.js
const express = require('express');
const {
  getDashboardStats,
  getUserActivity,
  getSystemHealth,
  getSecurityInsights,
  getContentInsights,
  getPredictiveAnalytics,
  getPerformanceMetrics
} = require('../controllers/analyticsController');
const { authenticate, requireAdminOrAbove, addTenantFilter } = require('../middlewares/auth');

const router = express.Router();

// Apply auth and tenant scoping for all analytics routes
router.use(authenticate, requireAdminOrAbove, addTenantFilter);

router.get('/dashboard', getDashboardStats);
router.get('/users', getUserActivity);
router.get('/system', getSystemHealth);
router.get('/security', getSecurityInsights);
router.get('/content', getContentInsights);
router.get('/predictions', getPredictiveAnalytics);
router.get('/performance', getPerformanceMetrics);

module.exports = router;