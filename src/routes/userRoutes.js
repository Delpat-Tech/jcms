// src/routes/userRoutes.js
const express = require('express');
const { 
  createUser, 
  createUserWithRole,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getImagesByUser 
} = require('../controllers/userController');
const auth = require('../middlewares/auth');
const { requireSuperAdmin, requireAdminOrAbove } = require('../middlewares/roleAuth');
const router = express.Router();

// Superadmin routes - require superadmin role
router.post('/create', auth, requireSuperAdmin, createUserWithRole);
router.get('/', auth, requireSuperAdmin, getAllUsers);
router.get('/:userId', auth, requireAdminOrAbove, getUserById);
router.put('/:userId', auth, requireSuperAdmin, updateUser);
router.delete('/:userId', auth, requireSuperAdmin, deleteUser);

// Legacy route - keep for backward compatibility
router.post('/legacy', createUser);

// Route to get all images for a specific user
router.get('/:userId/images', auth, getImagesByUser);

module.exports = router;