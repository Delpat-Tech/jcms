// routes/imageRoutes.js
const express = require('express');
const upload = require('../middlewares/upload');
const { authenticate } = require('../middlewares/auth');
const { logActivity } = require('../middlewares/activityLogger');
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

router.post('/', auth, logActivity('image_upload', 'image'), upload.single('image'), createImage);
router.get('/', auth, getImages);
router.get('/bulk', auth, getBulkImages);

// Image processing routes (before /:id to avoid conflicts)
router.post('/process/:id/sizes', auth, logActivity('image_process', 'image'), generateSizes);
router.post('/process/:id/size', auth, logActivity('image_process', 'image'), generateSpecificSize);
router.post('/process/:id/convert', auth, logActivity('image_convert', 'image'), convertFormat);

router.get('/:id', auth, getImageById);
router.put('/:id', auth, logActivity('image_update', 'image'), upload.single('image'), updateImage);
router.patch('/:id', auth, logActivity('image_update', 'image'), patchImage);
router.delete('/:id', auth, logActivity('image_delete', 'image'), deleteImage);

module.exports = router;