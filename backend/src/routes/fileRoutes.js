// routes/fileRoutes.js
const express = require('express');
const upload = require('../middlewares/upload');
const { uploadMultipleInSingleField } = require('../middlewares/upload');
const { uploadFile, getFiles, getFileById, deleteFile, convertFileFormat, getFilesByType, getRawFiles, getRawFileById } = require('../controllers/fileController');
const { authenticate, requireActiveUser } = require('../middlewares/auth');
const { logActivity } = require('../middlewares/activityLogger');
const { checkSubscription } = require('../middlewares/subscription');

const router = express.Router();

router.post('/upload', authenticate, requireActiveUser, logActivity('file_upload', 'file'), uploadMultipleInSingleField, uploadFile);
router.post('/upload-single', authenticate, requireActiveUser, logActivity('file_upload', 'file'), upload.single('file'), uploadFile);
router.post('/upload-multiple', authenticate, requireActiveUser, logActivity('file_upload', 'file'), upload.array('files', 10), uploadFile);
router.get('/', authenticate, getFiles);
router.get('/:id', authenticate, getFileById);
router.get('/type/:type', authenticate, (req, res, next) => {
  if (req.params.type && req.params.type.toLowerCase() === 'premium') {
    return checkSubscription('premium')(req, res, next);
  }
  return next();
}, getFilesByType);

router.put('/:id/convert', authenticate, requireActiveUser, logActivity('file_convert', 'file'), convertFileFormat);
router.delete('/:id', authenticate, requireActiveUser, logActivity('file_delete', 'file'), deleteFile);

// Raw JSON routes
router.get('/raw', authenticate, getRawFiles);
router.get('/:id/raw', authenticate, getRawFileById);

module.exports = router;