// routes/tenantRoutes.js
const express = require('express');
const { createTenant, getTenants, getTenantById, updateTenant, deleteTenant, createTenantUser, getTenantUsers, assignUserToTenant, removeTenantUser } = require('../controllers/tenantController');
const { authenticate, requireSuperAdmin, requireAdminOrAbove } = require('../middlewares/auth');

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

module.exports = router;