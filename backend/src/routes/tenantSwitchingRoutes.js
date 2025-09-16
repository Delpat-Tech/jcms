// routes/tenantSwitchingRoutes.js
const express = require('express');
const {
  getUserAccessibleTenants,
  switchTenantContext,
  getTenantBySubdomain,
  getCurrentTenantContext
} = require('../controllers/tenantSwitchingController');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();

// Protected routes (require authentication)
router.use('/my', authenticate);
router.get('/my/tenants', getUserAccessibleTenants);
router.post('/my/switch', switchTenantContext);
router.get('/my/context', getCurrentTenantContext);

// Public routes (no authentication required)
router.get('/public/:subdomain', getTenantBySubdomain);

module.exports = router;