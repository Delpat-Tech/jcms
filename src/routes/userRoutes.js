// routes/userRoutes.js
const express = require('express');
const {
  createUser,
  getAllUsers,
  getTenantUsers,
  getUserAnalytics,
  getUserDetails,
  getImagesByUser,
  updateUserRole,
  deleteUser
} = require('../controllers/userController');
const auth = require('../middlewares/auth');
const permit = require('../middlewares/rbac');
const validateTenant = require('../middlewares/validateTenant');

const router = express.Router();

// User analytics routes
router.get('/analytics', auth, validateTenant, permit('admin'), getUserAnalytics);
router.get('/details', auth, validateTenant, permit('admin'), getUserDetails);
router.get('/tenant-users', auth, validateTenant, permit('admin'), getTenantUsers);

// Admin-only routes should come first to avoid route conflicts
router.get('/all-users', auth, validateTenant, permit('admin'), getAllUsers);
router.patch('/role/:userId', auth, validateTenant, permit('admin'), updateUserRole);
router.delete('/:userId', auth, validateTenant, permit('admin'), deleteUser);

// Route to create a new user (public for registration)
router.post('/', createUser);

// Route to get all images for a specific user
router.get('/:userId/images', auth, validateTenant, permit('admin', 'editor', 'viewer'), getImagesByUser);

module.exports = router;
