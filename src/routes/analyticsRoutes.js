// routes/analyticsRoutes.js
const express = require('express');
const { getServerAnalytics, getTenantAnalytics, getDashboard } = require('../controllers/analyticsController');
const auth = require('../middlewares/auth');
const permit = require('../middlewares/rbac');

const router = express.Router();

// Admin-only analytics routes
router.get('/server', auth, permit('admin'), getServerAnalytics);
router.get('/tenants', auth, permit('admin'), getTenantAnalytics);
router.get('/dashboard', auth, permit('admin'), getDashboard);

module.exports = router;