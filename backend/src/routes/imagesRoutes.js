const express = require('express');
const upload = require('../middlewares/upload');
const { authenticate, requireActiveUser } = require('../middlewares/auth');
const { logActivity } = require('../middlewares/activityLogger');
const { checkSubscriptionLimits } = require('../middlewares/subscriptionLimits');
const auth = authenticate;

// --- Imports Updated ---
// We now import from the enhancedImageController
const {
  uploadImages,
  getContentPageImages,
  getImageById,
  updateImageMetadata,
  deleteImages, // This is the new bulk-delete function
  getR2Status,
  getImageAnalytics
} = require('../controllers/enhancedImageController');

// This import remains the same
const {
  generateSizes,
  generateSpecificSize,
  convertFormat,
  streamSize
} = require('../controllers/imageProcessingController');

const router = express.Router();

// --- Routes Updated ---

// POST /
// Uses 'uploadImages' and 'upload.array' for multi-file upload
router.post('/', auth, requireActiveUser, checkSubscriptionLimits, logActivity('image_upload', 'image'), upload.array('images', 10), uploadImages);

// GET /
// Uses 'getContentPageImages' which handles filtering, pagination, etc.
router.get('/', auth, getContentPageImages);

// GET /analytics
// New route for the analytics function
router.get('/analytics', auth, getImageAnalytics);

// GET /r2status
// New route to check R2 configuration
router.get('/r2status', auth, getR2Status);

// Image processing routes (these are good, no changes)
router.post('/process/:id/sizes', auth, requireActiveUser, logActivity('image_process', 'image'), generateSizes);
router.post('/process/:id/size', auth, requireActiveUser, logActivity('image_process', 'image'), generateSpecificSize);
router.post('/process/:id/convert', auth, requireActiveUser, logActivity('image_convert', 'image'), convertFormat);

// GET /:id/:size
// Good, no changes
router.get('/:id/:size', auth, streamSize);

// GET /:id
// Good, no changes
router.get('/:id', auth, getImageById);

// PUT /:id
// Uses 'updateImageMetadata' and removes 'upload' middleware, as it only updates text data
router.put('/:id', auth, requireActiveUser, logActivity('image_update', 'image'), updateImageMetadata);

// DELETE /:id
// This route now uses a small wrapper to adapt the single-ID delete (/:id)
// to the new 'deleteImages' controller, which expects an array.
const deleteSingleImage = (req, res, next) => {
  req.body.imageIds = [req.params.id];
  return deleteImages(req, res, next);
};
router.delete('/:id', auth, requireActiveUser, logActivity('image_delete', 'image'), deleteSingleImage);

module.exports = router;