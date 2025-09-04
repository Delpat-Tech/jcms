// routes/imageRoutes.js
const express = require('express');
const upload = require('../middlewares/upload');
const auth = require('../middlewares/auth');
const permit = require('../middlewares/rbac');

const {
  createImage,
  getImages,
  getImageById,
  updateImage,
  deleteImage,
  patchImage,
  getBulkImages
} = require('../controllers/imageController');

const router = express.Router();

// All users can upload and view their own images
router.post('/', auth, permit('admin', 'user'), upload.single('image'), createImage);
router.get('/', auth, permit('admin', 'user'), getImages);
router.get('/bulk', auth, permit('admin', 'user'), getBulkImages);
router.get('/:id', auth, permit('admin', 'user'), getImageById);

// All users can update their own images
router.put('/:id', auth, permit('admin', 'user'), upload.single('image'), updateImage);
router.patch('/:id', auth, permit('admin', 'user'), patchImage);

// All users can delete their own images
router.delete('/:id', auth, permit('admin', 'user'), deleteImage);

module.exports = router;