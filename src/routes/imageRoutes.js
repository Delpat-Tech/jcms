const express = require('express');
const upload = require('../middlewares/upload');
const router = express.Router();
const {
  createImage,
  getImages,
  getBulkImages,
  getImageById,
  updateImage,
  deleteImage
} = require('../controllers/imageController');

// POST /api/images
router.post('/', upload.single('image'), createImage);

// GET all (optional ?tenant & ?section)
router.get('/', getImages);

// GET bulk by section with query params
// /api/:section/bulk?tenant=xyz&limit=20&fields=title,avifUrl
router.get('/:section/bulk', getBulkImages);

// GET by id
router.get('/:id', getImageById);

// PUT /api/:section/:id
router.put('/:section/:id', upload.single('image'), updateImage);

// DELETE /api/images/:id
router.delete('/:id', deleteImage);

module.exports = router;
