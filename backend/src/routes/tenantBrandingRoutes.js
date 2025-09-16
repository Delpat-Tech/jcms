// routes/tenantBrandingRoutes.js
const express = require('express');
const {
  getTenantBranding,
  updateTenantBranding,
  uploadTenantLogo,
  uploadTenantFavicon,
  deleteTenantBrandingAsset,
  resetTenantBranding,
  generateTenantCSS
} = require('../controllers/tenantBrandingController');
const { authenticate, requireAdminOrAbove } = require('../middlewares/auth');
const { enforceTenantIsolation } = require('../middlewares/tenantMiddleware');

const router = express.Router();

// Apply authentication and tenant isolation to all routes
router.use(authenticate);

// Tenant branding management routes
router.get('/:tenantId', enforceTenantIsolation(), requireAdminOrAbove, getTenantBranding);
router.put('/:tenantId', enforceTenantIsolation(), requireAdminOrAbove, updateTenantBranding);

// Asset upload routes
router.post('/:tenantId/logo', enforceTenantIsolation(), requireAdminOrAbove, uploadTenantLogo);
router.post('/:tenantId/favicon', enforceTenantIsolation(), requireAdminOrAbove, uploadTenantFavicon);

// Asset management
router.delete('/:tenantId/:assetType', enforceTenantIsolation(), requireAdminOrAbove, deleteTenantBrandingAsset);
router.post('/:tenantId/reset', enforceTenantIsolation(), requireAdminOrAbove, resetTenantBranding);

// CSS generation (public route for loading tenant styles)
router.get('/:tenantId/styles.css', generateTenantCSS);

module.exports = router;