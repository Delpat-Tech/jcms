const express = require('express');
const upload = require('../middlewares/upload');
const validateImageDimensions = require('../middlewares/validateImageDimensions');

const router = express.Router();

// Import controllers (each in separate file now)
const createImage = require('../controllers/createImage');
const getImages = require('../controllers/getImages');
const getBulkImages = require('../controllers/getBulkImages');
const getImageById = require('../controllers/getImageById');
const updateImage = require('../controllers/updateImage');
const deleteImage = require('../controllers/deleteImage');

// POST /api/images
router.post(
  '/',
  upload.single('image'),
  validateImageDimensions(200, 2000, 200, 2000), // minWidth, maxWidth, minHeight, maxHeight
  createImage
);

// GET all (optional ?tenant & ?section)
router.get('/', getImages);

// GET bulk by section with query params
// /api/images/bulk?tenant=xyz&limit=20&fields=title,avifUrl
router.get('/:section/bulk', getBulkImages);

// GET by id
router.get('/:id', getImageById);

// PUT /api/images/:id
router.put(
  '/:id',
  upload.single('image'),
  validateImageDimensions(200, 2000, 200, 2000),
  updateImage
);

// DELETE /api/images/:id
router.delete('/:id', deleteImage);

module.exports = router;
