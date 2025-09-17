// routes/tenantRoutes.js
const express = require('express');
const { 
  createTenant, 
  getTenants, 
  getTenantById, 
  updateTenant, 
  deleteTenant, 
  createTenantUser, 
  getTenantUsers, 
  assignUserToTenant, 
  removeTenantUser,
  bulkCreateTenantUsers,
  bulkUpdateTenantUsers,
  bulkDeleteTenantUsers,
  getTenantStats,
  exportTenantUsers,
  uploadTenantLogo
} = require('../controllers/tenantController');
const { authenticate, requireSuperAdmin, requireAdminOrAbove } = require('../middlewares/auth');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

// Tenant CRUD (superadmin only)
router.post('/', authenticate, requireSuperAdmin, createTenant);
router.get('/', authenticate, requireSuperAdmin, getTenants);
router.get('/:id', authenticate, requireSuperAdmin, getTenantById);
router.put('/:id', authenticate, requireSuperAdmin, updateTenant);
router.delete('/:id', authenticate, requireSuperAdmin, deleteTenant);

// Test route
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Tenant routes working' });
});

// Tenant user management
router.post('/:tenantId/users', authenticate, requireAdminOrAbove, createTenantUser);
router.get('/:tenantId/users', authenticate, requireAdminOrAbove, getTenantUsers);
router.put('/users/:userId/assign/:tenantId', authenticate, requireSuperAdmin, assignUserToTenant);
router.delete('/:tenantId/users/:userId', authenticate, requireAdminOrAbove, removeTenantUser);

// Bulk operations for tenant users
router.post('/:tenantId/users/bulk', authenticate, requireAdminOrAbove, bulkCreateTenantUsers);
router.put('/:tenantId/users/bulk', authenticate, requireAdminOrAbove, bulkUpdateTenantUsers);
router.delete('/:tenantId/users/bulk', authenticate, requireAdminOrAbove, bulkDeleteTenantUsers);

// Tenant analytics and reporting
router.get('/:tenantId/stats', authenticate, requireAdminOrAbove, getTenantStats);
router.get('/:tenantId/users/export', authenticate, requireAdminOrAbove, exportTenantUsers);

// Test route for debugging
router.get('/:tenantId/test-logo', (req, res) => {
  res.json({ success: true, message: 'Logo route accessible', tenantId: req.params.tenantId });
});

// Tenant branding
router.post('/:tenantId/logo', authenticate, upload.single('logo'), uploadTenantLogo);

module.exports = router;