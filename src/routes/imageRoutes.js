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

router.post('/', auth, logActivity('CREATE', 'image'), upload.single('image'), createImage);
router.get('/', auth, getImages);
router.get('/bulk', auth, getBulkImages);

// Image processing routes (before /:id to avoid conflicts)
router.post('/process/:id/sizes', auth, logActivity('PROCESS', 'image'), generateSizes);
router.post('/process/:id/size', auth, logActivity('PROCESS', 'image'), generateSpecificSize);
router.post('/process/:id/convert', auth, logActivity('CONVERT', 'image'), convertFormat);

router.get('/:id', auth, getImageById);
router.put('/:id', auth, logActivity('UPDATE', 'image'), upload.single('image'), updateImage);
router.patch('/:id', auth, logActivity('UPDATE', 'image'), patchImage);
router.delete('/:id', auth, logActivity('DELETE', 'image'), deleteImage);

module.exports = router;