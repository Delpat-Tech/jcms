// routes/fileRoutes.js
const express = require('express');
const upload = require('../middlewares/upload');
const { uploadFile, getFiles, getFileById, deleteFile, convertFileFormat } = require('../controllers/fileController');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();

router.post('/upload', authenticate, upload.single('file'), uploadFile);
router.get('/', authenticate, getFiles);
router.get('/:id', authenticate, getFileById);
router.put('/:id/convert', authenticate, convertFileFormat);
router.delete('/:id', authenticate, deleteFile);

module.exports = router;