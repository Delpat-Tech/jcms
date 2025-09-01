// routes/analyticsRoutes.js
const express = require('express');
const { getServerAnalytics, getTenantAnalytics, getDashboard } = require('../controllers/analyticsController');
const auth = require('../middlewares/auth');
const permit = require('../middlewares/rbac');
const validateTenant = require('../middlewares/validateTenant');

const router = express.Router();

// Admin-only analytics routes
router.get('/server', auth, validateTenant, permit('admin'), getServerAnalytics);
router.get('/tenants', auth, validateTenant, permit('admin'), getTenantAnalytics);
router.get('/dashboard', auth, validateTenant, permit('admin'), getDashboard);

module.exports = router;