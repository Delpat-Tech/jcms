const express = require('express');
const multer = require('multer');
const router = express.Router();

const {
  createImage,
  getImages,
  getImageById,
  updateImage,
  deleteImage
} = require('../controllers/imageController');

// Multer setup (store in memory so Sharp can process it)
const storage = multer.memoryStorage();
const upload = multer({ storage });


// POST /api/images - Create a new image
router.post('/', upload.single('image'), createImage);


// GET /api/images - Get all images
router.get('/', getImages);

// GET /api/images/:id - Get image by ID
router.get('/:id', getImageById);

// PUT /api/images/:id - Update image by ID
router.put('/:id', updateImage);

// DELETE /api/images/:id - Delete image by ID
router.delete('/:id', deleteImage);

module.exports = router;
