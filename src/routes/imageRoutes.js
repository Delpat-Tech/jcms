const express = require('express');
const router = express.Router();
const {
  createImage,
  getImages,
  getImageById,
  updateImage,
  deleteImage
} = require('../controllers/imageController');

// POST /api/images - Create a new image
router.post('/', createImage);

// GET /api/images - Get all images
router.get('/', getImages);

// GET /api/images/:id - Get image by ID
router.get('/:id', getImageById);

// PUT /api/images/:id - Update image by ID
router.put('/:id', updateImage);

// DELETE /api/images/:id - Delete image by ID
router.delete('/:id', deleteImage);

module.exports = router;
