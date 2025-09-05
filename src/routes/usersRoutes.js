// src/routes/usersRoutes.js - Unified user management API
const express = require('express');
const { 
  createUserWithRole,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getImagesByUser 
} = require('../controllers/userController');
const { authenticate, requireAdminOrAbove } = require('../middlewares/auth');
const { logActivity } = require('../middlewares/activityLogger');
const router = express.Router();

// All routes require authentication and admin role or above
router.use(authenticate, requireAdminOrAbove);

// User Management Routes - Same API, different results based on role
router.post('/', logActivity('CREATE', 'user'), createUserWithRole);           // Create user
router.get('/', getAllUsers);                   // Get all users (filtered by role)
router.get('/:userId', getUserById);            // Get specific user (filtered by role)
router.put('/:userId', logActivity('UPDATE', 'user'), updateUser);             // Update user
router.delete('/:userId', logActivity('DELETE', 'user'), deleteUser);          // Delete user
router.get('/:userId/images', getImagesByUser); // Get user's images

module.exports = router;