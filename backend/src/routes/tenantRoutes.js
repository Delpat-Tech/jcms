// src/routes/tenantRoutes.js
const express = require('express');
const { 
  createTenant, 
  createTenantOnly,
  createTenantAdmin,
  registerTenantWithAdmin,
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
  exportTenantUsers
} = require('../controllers/tenantController');

// Correct import for uploadTenantLogo
const { uploadTenantLogo } = require('../controllers/tenantBrandingController');
const { authenticate, requireSuperAdmin, requireAdminOrAbove } = require('../middlewares/auth');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

// Tenant CRUD (superadmin only)
router.post('/', authenticate, requireSuperAdmin, createTenant);
router.post('/create', authenticate, requireSuperAdmin, createTenantOnly);
router.post('/:tenantId/admin', authenticate, requireSuperAdmin, createTenantAdmin);
router.post('/register', registerTenantWithAdmin);
router.get('/', authenticate, requireSuperAdmin, getTenants);
router.get('/:id', authenticate, requireSuperAdmin, getTenantById);
router.put('/:id', authenticate, requireSuperAdmin, updateTenant);
router.delete('/:id', authenticate, requireSuperAdmin, deleteTenant);

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

// Tenant branding
router.post('/:tenantId/logo', authenticate, upload.single('logo'), uploadTenantLogo);

module.exports = router;