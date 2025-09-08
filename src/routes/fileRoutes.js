// routes/fileRoutes.js
const express = require('express');
const upload = require('../middlewares/upload');
const { uploadMultipleInSingleField } = require('../middlewares/upload');
const { uploadFile, getFiles, getFileById, deleteFile, convertFileFormat, getFilesByType } = require('../controllers/fileController');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();

router.post('/upload', authenticate, uploadMultipleInSingleField, uploadFile);
router.post('/upload-single', authenticate, upload.single('file'), uploadFile);
router.post('/upload-multiple', authenticate, upload.array('files', 10), uploadFile);
router.get('/', authenticate, getFiles);
router.get('/:id', authenticate, getFileById);
router.get('/type/:type', authenticate, getFilesByType);
router.put('/:id/convert', authenticate, convertFileFormat);
router.delete('/:id', authenticate, deleteFile);

module.exports = router;