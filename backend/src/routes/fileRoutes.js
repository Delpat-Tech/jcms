// routes/fileRoutes.js
const express = require('express');
const upload = require('../middlewares/upload');
const { uploadMultipleInSingleField } = require('../middlewares/upload');
const { uploadFile, getFiles, getFileById, deleteFile, convertFileFormat, getFilesByType } = require('../controllers/fileController');
const { authenticate } = require('../middlewares/auth');
const { logActivity } = require('../middlewares/activityLogger');

const router = express.Router();

router.post('/upload', authenticate, logActivity('file_upload', 'file'), uploadMultipleInSingleField, uploadFile);
router.post('/upload-single', authenticate, logActivity('file_upload', 'file'), upload.single('file'), uploadFile);
router.post('/upload-multiple', authenticate, logActivity('file_upload', 'file'), upload.array('files', 10), uploadFile);
router.get('/', authenticate, getFiles);
router.get('/:id', authenticate, getFileById);
router.get('/type/:type', authenticate, getFilesByType);
router.put('/:id/convert', authenticate, logActivity('file_convert', 'file'), convertFileFormat);
router.delete('/:id', authenticate, logActivity('file_delete', 'file'), deleteFile);

module.exports = router;