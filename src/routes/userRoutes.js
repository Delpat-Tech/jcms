// src/routes/userRoutes.js
const express = require('express');
const { createUser, getImagesByUser, getAllUsers } = require('../controllers/userController');
const auth = require('../middlewares/auth');
const permit = require('../middlewares/rbac');
const router = express.Router();

// Route to create a new user (public)
router.post('/', createUser);

// Admin-only: Get all users
router.get('/', auth, permit('admin'), getAllUsers);

// Route to get all images for a specific user
router.get('/:userId/images', getImagesByUser);

module.exports = router;