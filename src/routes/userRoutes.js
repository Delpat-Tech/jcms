// src/routes/userRoutes.js
const express = require('express');
const { createUser, getImagesByUser } = require('../controllers/userController');
const router = express.Router();

// Route to create a new user
router.post('/', createUser);

// Route to get all images for a specific user
router.get('/:userId/images', getImagesByUser);

module.exports = router;