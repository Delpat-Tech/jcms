// src/routes/usersRoutes.js - Unified user management API
const express = require('express');
const { 
  createUserWithRole,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  reactivateUser,
  getImagesByUser 
} = require('../controllers/userController');
const { authenticate, requireAdminOrAbove } = require('../middlewares/auth');
const { restrictEditorAccess } = require('../middlewares/editorRestriction');
const { logActivity } = require('../middlewares/activityLogger');
const { validateSingleSuperAdmin, protectSystemSuperAdmin } = require('../middlewares/superadminValidation');
const router = express.Router();

// All routes require authentication, block editors, and admin role or above
router.use(authenticate, restrictEditorAccess, requireAdminOrAbove);

// User Management Routes - Same API, different results based on role
router.post('/', validateSingleSuperAdmin, logActivity('CREATE', 'user'), createUserWithRole);           // Create user
router.get('/', getAllUsers);                   // Get all users (filtered by role)
router.get('/:userId', getUserById);            // Get specific user (filtered by role)
router.put('/:userId', protectSystemSuperAdmin, validateSingleSuperAdmin, logActivity('UPDATE', 'user'), updateUser);             // Update user
router.delete('/:userId', protectSystemSuperAdmin, logActivity('DELETE', 'user'), deleteUser);          // Delete user (soft delete)
router.post('/:userId/reactivate', protectSystemSuperAdmin, logActivity('REACTIVATE', 'user'), reactivateUser); // Reactivate user
router.get('/:userId/images', getImagesByUser); // Get user's images

module.exports = router;