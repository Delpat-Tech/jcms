// routes/tenantAnalyticsRoutes.js
const express = require('express');
const { 
  getTenantDashboard,
  getTenantUsageHistory,
  getTenantPerformanceMetrics,
  getTenantActivityReport,
  compareTenants
} = require('../controllers/tenantAnalyticsController');
const { authenticate, requireAdminOrAbove, requireSuperAdmin } = require('../middlewares/auth');
const { enforceTenantIsolation, logTenantAccess } = require('../middlewares/tenantMiddleware');

const router = express.Router();

// Apply authentication and tenant isolation to all routes
router.use(authenticate);
router.use(enforceTenantIsolation());

// Tenant analytics routes (admin or above can access their tenant's analytics)
router.get('/:tenantId/dashboard', 
  requireAdminOrAbove, 
  logTenantAccess('analytics'),
  getTenantDashboard
);

router.get('/:tenantId/usage-history', 
  requireAdminOrAbove, 
  logTenantAccess('analytics'),
  getTenantUsageHistory
);

router.get('/:tenantId/performance', 
  requireAdminOrAbove, 
  logTenantAccess('analytics'),
  getTenantPerformanceMetrics
);

router.get('/:tenantId/activity-report', 
  requireAdminOrAbove, 
  logTenantAccess('analytics'),
  getTenantActivityReport
);

// Superadmin only - compare multiple tenants
router.get('/compare', 
  requireSuperAdmin, 
  logTenantAccess('tenant-comparison'),
  compareTenants
);

// Test route for analytics
router.get('/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Tenant analytics routes working',
    user: {
      id: req.user.id,
      role: req.user.role.name,
      tenant: req.user.tenant?.name || 'none'
    }
  });
});

module.exports = router;