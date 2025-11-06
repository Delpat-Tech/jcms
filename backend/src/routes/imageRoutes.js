// src/routes/imagesRoutes.js
const express = require('express');
const upload = require('../middlewares/upload');
const { authenticate, requireActiveUser, requireEditorOrAbove } = require('../middlewares/auth');
const { logActivity } = require('../middlewares/activityLogger');
const { checkSubscriptionLimits } = require('../middlewares/subscriptionLimits');
const auth = authenticate;

// --- Imports Updated ---
const {
  uploadImages,
  getContentPageImages,
  getImageById,
  updateImageMetadata,
  deleteImages,
  getR2Status,
  getImageAnalytics
} = require('../controllers/enhancedImageController');

// --- Routes from imageProcessingController ---
const {
  generateSizes,
  generateSpecificSize,
  convertFormat,
  streamSize
} = require('../controllers/imageProcessingController');

const router = express.Router();

// --- Image Management Routes ---
router.post('/', auth, requireActiveUser, checkSubscriptionLimits, logActivity('image_upload', 'image'), upload.array('images', 10), uploadImages);
router.get('/', auth, getContentPageImages);
router.get('/analytics', auth, getImageAnalytics);
router.get('/r2status', auth, getR2Status);
router.get('/:id', auth, getImageById);
router.put('/:id', auth, requireActiveUser, logActivity('image_update', 'image'), updateImageMetadata);

// --- Image Processing Routes (Merged) ---
router.post('/process/:id/sizes', auth, requireEditorOrAbove, logActivity('image_process', 'image'), generateSizes);
router.post('/process/:id/size', auth, requireEditorOrAbove, logActivity('image_process', 'image'), generateSpecificSize);
router.post('/process/:id/convert', auth, requireEditorOrAbove, logActivity('image_convert', 'image'), convertFormat);
router.get('/:id/:size', auth, streamSize); // Stream a specific size

// --- Delete Route ---
const deleteSingleImage = (req, res, next) => {
  req.body.imageIds = [req.params.id];
  return deleteImages(req, res, next);
};
router.delete('/:id', auth, requireActiveUser, logActivity('image_delete', 'image'), deleteSingleImage);

module.exports = router;