// src/routes/superadminRoutes.js
const express = require('express');
const { 
  createUserWithRole,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser
} = require('../controllers/userController');
const auth = require('../middlewares/auth');
const { requireSuperAdmin } = require('../middlewares/roleAuth');
const router = express.Router();

// All routes require authentication and superadmin role
router.use(auth, requireSuperAdmin);

// POST /api/superadmin/users - Create user with role assignment
router.post('/users', createUserWithRole);

// GET /api/superadmin/users - Get all users
router.get('/users', getAllUsers);

// GET /api/superadmin/users/:userId - Get user by ID
router.get('/users/:userId', getUserById);

// PUT /api/superadmin/users/:userId - Update user (role, status, etc.)
router.put('/users/:userId', updateUser);

// DELETE /api/superadmin/users/:userId - Delete user
router.delete('/users/:userId', deleteUser);

module.exports = router;