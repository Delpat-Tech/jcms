// routes/userRoutes.js
const express = require('express');
const { createUser, getImagesByUser, getAllUsers, updateUserRole } = require('../controllers/userController');
const auth = require('../middlewares/auth');
const permit = require('../middlewares/rbac');

const router = express.Router();

// Admin-only routes should come first to avoid route conflicts
router.get('/all-users', auth, permit('admin'), getAllUsers);
router.patch('/role/:userId', auth, permit('admin'), updateUserRole);

// Route to create a new user
router.post('/', createUser);

// Route to get all images for a specific user
router.get('/:userId/images', getImagesByUser);

module.exports = router;
