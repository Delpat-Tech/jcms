// src/routes/adminRoutes.js
const express = require('express');
const {
  createImage,
  getImages,
  getImageById,
  updateImage,
  deleteImage
} = require('../controllers/imageController');
const { authenticate, requireAdminOrAbove } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const router = express.Router();

// All routes require authentication and admin role or above
router.use(authenticate, requireAdminOrAbove);

// User management has been moved to unified /api/users routes

// Image management moved to unified /api/admin-images

module.exports = router;