// routes/imageRoutes.js
const express = require('express');
const upload = require('../middlewares/upload');
const { authenticate } = require('../middlewares/auth');
const auth = authenticate;

const {
  createImage,
  getImages,
  getImageById,
  updateImage,
  deleteImage,
  patchImage,
  getBulkImages
} = require('../controllers/imageController');

const {
  generateSizes,
  generateSpecificSize,
  convertFormat
} = require('../controllers/imageProcessingController');

const router = express.Router();

router.post('/', auth, upload.single('image'), createImage);
router.get('/', auth, getImages);
router.get('/bulk', auth, getBulkImages);

// Image processing routes (before /:id to avoid conflicts)
router.post('/process/:id/sizes', auth, generateSizes);
router.post('/process/:id/size', auth, generateSpecificSize);
router.post('/process/:id/convert', auth, convertFormat);

router.get('/:id', auth, getImageById);
router.put('/:id', auth, upload.single('image'), updateImage);
router.patch('/:id', auth, patchImage);
router.delete('/:id', auth, deleteImage);

module.exports = router;