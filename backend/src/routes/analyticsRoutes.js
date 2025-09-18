// routes/analyticsRoutes.js
const express = require('express');
const { getDashboardStats, getUserActivity, getSystemHealth, getSecurityInsights, getContentInsights, getPredictiveAnalytics, getPerformanceMetrics } = require('../controllers/analyticsController');
const { authenticate, requireAdminOrAbove } = require('../middlewares/auth');

const router = express.Router();

router.get('/dashboard', authenticate, requireAdminOrAbove, getDashboardStats);
 
router.get('/users', authenticate, requireAdminOrAbove, getUserActivity);
router.get('/system', authenticate, requireAdminOrAbove, getSystemHealth);
router.get('/security', authenticate, requireAdminOrAbove, getSecurityInsights);
router.get('/content', authenticate, requireAdminOrAbove, getContentInsights);
router.get('/predictions', authenticate, requireAdminOrAbove, getPredictiveAnalytics);
router.get('/performance', authenticate, requireAdminOrAbove, getPerformanceMetrics);

module.exports = router;