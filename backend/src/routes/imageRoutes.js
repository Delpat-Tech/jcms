// routes/imageRoutes.js
const express = require('express');
const upload = require('../middlewares/upload');
const { authenticate, requireActiveUser } = require('../middlewares/auth');
const { logActivity } = require('../middlewares/activityLogger');
const { checkUploadLimit } = require('../middlewares/subscriptionLimits');
const auth = authenticate;

const {
  createImage,
  getImages,
  getImageById,
  updateImage,
  deleteImage,
  patchImage,
  getBulkImages,
  getRawImages,
  getRawImageById
} = require('../controllers/imageController');

const {
  generateSizes,
  generateSpecificSize,
  convertFormat,
  streamSize
} = require('../controllers/imageProcessingController');

const router = express.Router();

router.post('/', auth, requireActiveUser, upload.single('image'), checkUploadLimit, logActivity('image_upload', 'image'), createImage);
router.get('/', auth, getImages);
router.get('/bulk', auth, getBulkImages);

// Image processing routes (before /:id to avoid conflicts)
router.post('/process/:id/sizes', auth, requireActiveUser, logActivity('image_process', 'image'), generateSizes);
router.post('/process/:id/size', auth, requireActiveUser, logActivity('image_process', 'image'), generateSpecificSize);
router.post('/process/:id/convert', auth, requireActiveUser, logActivity('image_convert', 'image'), convertFormat);

router.get('/:id/:size', auth, streamSize);
router.get('/:id', auth, getImageById);
router.put('/:id', auth, requireActiveUser, logActivity('image_update', 'image'), upload.single('image'), updateImage);
router.patch('/:id', auth, requireActiveUser, logActivity('image_update', 'image'), patchImage);
router.delete('/:id', auth, requireActiveUser, logActivity('image_delete', 'image'), deleteImage);

// Raw JSON routes
router.get('/raw', auth, getRawImages);
router.get('/:id/raw', auth, getRawImageById);

module.exports = router;