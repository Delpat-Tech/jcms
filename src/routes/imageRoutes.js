// src/routes/imageRoutes.js
const express = require('express');
const upload = require('../middlewares/upload');
const auth = require('../middlewares/auth');
const permit = require('../middlewares/rbac');
const validateTenant = require('../middlewares/validateTenant');

const {
  createImage,
  getImages,
  getImageById,
  updateImage,
  deleteImage,
  patchImage
} = require('../controllers/imageController');

const router = express.Router();

// Admin & editor can create
router.post('/', auth, validateTenant, permit('admin', 'editor'), upload.single('image'), createImage);

// All roles can view
router.get('/', auth, validateTenant, permit('admin', 'editor', 'viewer'), getImages);
router.get('/:id', auth, validateTenant, permit('admin', 'editor', 'viewer'), getImageById);

// Admin & editor can update
router.put('/:id', auth, validateTenant, permit('admin', 'editor'), upload.single('image'), updateImage);
router.patch('/:id', auth, validateTenant, permit('admin', 'editor'), patchImage);

// Admin & editor can access the delete endpoint
router.delete('/:id', auth, validateTenant, permit('admin', 'editor'), deleteImage);

module.exports = router;