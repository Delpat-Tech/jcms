// src/routes/imageRoutes.js
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
  genericPatch,
} = require('../controllers');

const router = express.Router();

// Admin & editor can create
router.post('/', auth, permit('admin', 'editor'), upload.single('image'), createImage);

// All roles can view
router.get('/', auth, permit('admin', 'editor', 'viewer'), getImages);
router.get('/:id', auth, permit('admin', 'editor', 'viewer'), getImageById);

// Admin & editor can update
router.put('/:id', auth, permit('admin', 'editor'), upload.single('image'), updateImage);
router.patch('/:id', auth, permit('admin', 'editor'), genericPatch);

// Admin & editor can access the delete endpoint
router.delete('/:id', auth, permit('admin', 'editor'), deleteImage);

module.exports = router;