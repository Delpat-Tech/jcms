// src/routes/jsonDocumentRoutes.js
const express = require('express');
const { getJsonDocumentsByFile, getAllJsonDocuments } = require('../controllers/jsonDocumentController');
// Import the 'updateFile' function from the correct controller
const { updateFile } = require('../controllers/fileController');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();

router.get('/file/:fileId', authenticate, getJsonDocumentsByFile);
router.get('/', authenticate, getAllJsonDocuments);

// This route now correctly points to the 'updateFile' function
router.post('/refresh/:fileId', authenticate, updateFile);

module.exports = router;