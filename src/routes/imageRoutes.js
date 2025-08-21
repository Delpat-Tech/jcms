const express = require('express');
const upload = require('../middlewares/upload');
const router = express.Router();
const {
  createImage,
  getImages,
  getImageById,
  updateImage,
  deleteImage
} = require('../controllers/imageController');

// POST /api/images
router.post('/', upload.single('image'), createImage);

// GET all
router.get('/', getImages);

// GET by id
router.get('/:id', getImageById);

// PUT /api/images/:id
router.put('/:id', upload.single('image'), updateImage);

// DELETE /api/images/:id
router.delete('/:id', deleteImage);

module.exports = router;
