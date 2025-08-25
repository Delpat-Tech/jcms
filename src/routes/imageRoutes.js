// routes/imageRoutes.js
const express = require('express');
const upload = require('../middlewares/upload');
const validateImageDimensions = require('../middlewares/validateImageDimensions');
const auth = require('../middlewares/auth'); // 👈 Import the auth middleware

const router = express.Router();

// Import controllers
const {
  createImage,
  getImages,
  getBulkImages,
  getImageById,
  updateImage,
  deleteImage,
  genericPatch,
} = require('../controllers'); // Using index.js for cleaner imports

// POST /api/images (Protected)
router.post(
  '/',
  auth, // 👈 Apply auth middleware
  upload.single('image'),
  validateImageDimensions(200, 2000, 200, 2000),
  createImage
);

// GET all (Public)
router.get('/', getImages);

// GET bulk by section (Public)
router.get('/:section/bulk', getBulkImages);

// GET by id (Public)
router.get('/:id', getImageById);

// PUT /api/images/:id (Protected)
router.put(
  '/:id',
  auth, // 👈 Apply auth middleware
  upload.single('image'),
  validateImageDimensions(200, 2000, 200, 2000),
  updateImage
);

// DELETE /api/images/:id (Protected)
router.delete(
  '/:id',
  auth, // 👈 Apply auth middleware
  deleteImage
);

router.patch('/:id', auth, genericPatch);

module.exports = router;