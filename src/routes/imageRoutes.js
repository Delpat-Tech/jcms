// routes/imageRoutes.js
const express = require('express');
const upload = require('../middlewares/upload');
const auth = require('../middlewares/auth');

// Import ALL the controllers you need for your routes
const {
  createImage,
  getImages,
  getImageById,       // 👈 Add this
  updateImage,        // 👈 Add this
  deleteImage,        // 👈 Add this
  genericPatch,       // 👈 Add this
  getBulkImages       // 👈 Add this
} = require('../controllers');

const router = express.Router();

// All image routes are now protected by JWT authentication
router.post('/', auth, upload.single('image'), createImage);
router.get('/', auth, getImages);
router.get('/bulk', auth, getBulkImages); // Added auth to bulk route
router.get('/:id', auth, getImageById);
router.put('/:id', auth, upload.single('image'), updateImage);
router.patch('/:id', auth, genericPatch);
router.delete('/:id', auth, deleteImage);

module.exports = router;