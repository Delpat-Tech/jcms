// src/routes/profileRoutes.js
const express = require('express');
const { updateProfile, resetUserPassword } = require('../controllers/userController');
const { authenticate, requireAdminOrAbove } = require('../middlewares/auth');
const { logActivity } = require('../middlewares/activityLogger');
const router = express.Router();

// Profile update route - any authenticated user can update their own profile
router.put('/', authenticate, logActivity('UPDATE', 'profile'), updateProfile);

// Password reset route - admin can reset editor, superadmin can reset admin
router.put('/reset-password/:userId', authenticate, requireAdminOrAbove, logActivity('RESET_PASSWORD', 'user'), resetUserPassword);

module.exports = router;