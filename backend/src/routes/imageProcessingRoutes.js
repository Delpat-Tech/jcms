// routes/imageProcessingRoutes.js
const express = require('express');
const { authenticate, requireEditorOrAbove } = require('../middlewares/auth');
const { generateSizes, generateSpecificSize, convertFormat } = require('../controllers/imageProcessingController');

const router = express.Router();

// Generate multiple sizes for an image
router.post('/process/:id/sizes', authenticate, requireEditorOrAbove, generateSizes);

// Generate specific size for an image
router.post('/process/:id/size', authenticate, requireEditorOrAbove, generateSpecificSize);

// Convert image format
router.post('/process/:id/convert', authenticate, requireEditorOrAbove, convertFormat);

module.exports = router;