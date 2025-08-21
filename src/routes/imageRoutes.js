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

// POST /api/:section
router.post('/:section', upload.single('image'), createImage);

// GET all
router.get('/', getImages);

// GET by id
router.get('/:id', getImageById);

// PUT /api/:section/:id
router.put('/:section/:id', upload.single('image'), updateImage);

// DELETE /api/:section/:id
router.delete('/:section/:id', deleteImage);

module.exports = router;
