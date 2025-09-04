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

// Image Management Routes
router.post('/images', upload.single('image'), createImage);
router.get('/images', getImages);
router.get('/images/:id', getImageById);
router.put('/images/:id', upload.single('image'), updateImage);
router.delete('/images/:id', deleteImage);

module.exports = router;