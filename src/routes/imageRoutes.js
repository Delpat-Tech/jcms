const express = require('express');
const upload = require('../middlewares/upload');
const auth = require('../middlewares/auth');
const permit = require('../middlewares/rbac'); // 👈 Import RBAC middleware

// Import all controllers
const {
  createImage,
  getImages,
  getBulkImages,
  getImageById,
  updateImage,
  deleteImage,
  genericPatch
} = require('../controllers');

const router = express.Router();

// Admin & editor can create images
router.post('/', auth, permit('admin', 'editor'), upload.single('image'), createImage);

// All roles can view images
router.get('/', auth, permit('admin', 'editor', 'viewer'), getImages);
router.get('/bulk', auth, permit('admin', 'editor', 'viewer'), getBulkImages);
router.get('/:id', auth, permit('admin', 'editor', 'viewer'), getImageById);

// Admin & editor can update images
router.put('/:id', auth, permit('admin', 'editor'), upload.single('image'), updateImage);
router.patch('/:id', auth, permit('admin', 'editor'), genericPatch);

// Only admin can delete images
router.delete('/:id', auth, permit('admin'), deleteImage);

module.exports = router;
