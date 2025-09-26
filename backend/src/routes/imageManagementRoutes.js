// routes/imageManagementRoutes.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const { authenticate, requireEditorOrAbove } = require('../middlewares/auth');
const enhancedImageController = require('../controllers/enhancedImageController');
const imageCollectionController = require('../controllers/imageCollectionController');
const simpleCollectionController = require('../controllers/simpleCollectionController');
const imageMigrationController = require('../controllers/imageMigrationController');
const tunnelController = require('../controllers/tunnelController');

const router = express.Router();

// Configure multer for image uploads
const fs = require('fs');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'temp');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'temp-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Check if file is an image
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 10 // Maximum 10 files at once
  }
});

// Apply authentication and role requirements to all routes
router.use(authenticate, requireEditorOrAbove);

// Image upload routes
router.post('/upload', 
  upload.array('images', 10),
  enhancedImageController.uploadImages
);

// Content management routes
router.get('/content-page', 
  enhancedImageController.getContentPageImages
);

router.get('/analytics',
  enhancedImageController.getImageAnalytics
);

// Collection management routes (MUST come before /:id route)
router.post('/collections',
  simpleCollectionController.createCollection
);

router.get('/collections',
  simpleCollectionController.getCollections
);

router.get('/collections/:id',
  imageCollectionController.getCollectionById
);

router.put('/collections/:id',
  imageCollectionController.updateCollection
);

router.delete('/collections/:id',
  imageCollectionController.deleteCollection
);

router.post('/collections/:id/make-public',
  imageCollectionController.makeCollectionPublic
);

router.post('/collections/:id/make-private',
  imageCollectionController.makeCollectionPrivate
);

router.post('/collections/:id/add-images',
  imageCollectionController.addImagesToCollection
);

// Remove images from collection
router.post('/collections/:id/remove-images', async (req, res) => {
  try {
    const { imageIds } = req.body;
    const Image = require('../models/image');
    
    const result = await Image.updateMany(
      { _id: { $in: imageIds }, collection: req.params.id },
      { $unset: { collection: 1 } }
    );
    
    res.json({ success: true, message: `Removed ${result.modifiedCount} images from collection`, modifiedCount: result.modifiedCount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Individual image routes (MUST come after specific routes)
router.get('/:id',
  enhancedImageController.getImageById
);

router.patch('/:id/metadata',
  enhancedImageController.updateImageMetadata
);

// Visibility management routes
router.post('/make-public',
  enhancedImageController.makeImagesPublic
);

router.post('/make-private',
  enhancedImageController.makeImagesPrivate
);

// Bulk operations
router.delete('/bulk-delete',
  enhancedImageController.deleteImages
);

// System status routes
router.get('/system/r2-status',
  enhancedImageController.getR2Status
);

// Migration helper routes
router.get('/migration/unorganized',
  imageMigrationController.findUnorganizedImages
);

router.post('/migration/create-collection-with-images',
  imageMigrationController.createCollectionWithImages
);

router.get('/migration/collections-with-counts',
  imageMigrationController.getCollectionsWithCounts
);

// Cloudflare Tunnel routes
router.post('/tunnel/start',
  tunnelController.startTunnel
);

router.post('/tunnel/stop',
  tunnelController.stopTunnel
);

router.get('/tunnel/status',
  tunnelController.getTunnelStatus
);

router.post('/tunnel/collections/:id/make-public',
  tunnelController.makeCollectionPublic
);

router.post('/tunnel/collections/:id/make-private',
  tunnelController.makeCollectionPrivate
);

router.get('/tunnel/collections/:id/download-zip',
  tunnelController.downloadCollectionZip
);

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 50MB per file.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum is 10 files per upload.'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected field name. Use "images" field for file uploads.'
      });
    }
  }
  
  if (error.message === 'Only image files are allowed') {
    return res.status(400).json({
      success: false,
      message: 'Only image files are allowed. Supported formats: JPG, PNG, GIF, WebP, AVIF, TIFF, BMP.'
    });
  }
  
  next(error);
});

module.exports = router;
