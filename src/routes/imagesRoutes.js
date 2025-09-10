// src/routes/imagesRoutes.js
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
const { logActivity } = require('../middlewares/activityLogger');
const router = express.Router();

// All routes require authentication (role-based permissions handled in controller)
router.use(authenticate);

// Unified Image Management Routes for All Roles (permissions handled in controller)
router.post('/', logActivity('image_upload', 'image'), upload.single('image'), createImage);
router.get('/', getImages); // Supports ?own=true to see only user's images
router.get('/:id', getImageById);
router.put('/:id', logActivity('image_update', 'image'), upload.single('image'), updateImage);
router.delete('/:id', logActivity('image_delete', 'image'), deleteImage);

module.exports = router;