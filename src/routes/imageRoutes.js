// routes/imageRoutes.js
const express = require('express');
const upload = require('../middlewares/upload');
const validateImageDimensions = require('../middlewares/validateImageDimensions');
const auth = require('../middlewares/auth');

const router = express.Router();

const {
  createImage,
  getImages,
  getBulkImages,
  getImageById,
  updateImage,
  deleteImage,
  genericPatch,
} = require('../controllers');

router.post('/', auth, upload.single('image'), validateImageDimensions(200, 2000, 200, 2000), createImage);
router.get('/', getImages);
router.get('/bulk', getBulkImages); // Changed route
router.get('/:id', getImageById);
router.put('/:id', auth, upload.single('image'), validateImageDimensions(200, 2000, 200, 2000), updateImage);
router.delete('/:id', auth, deleteImage);
router.patch('/:id', auth, genericPatch);

module.exports = router;