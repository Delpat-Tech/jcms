// src/routes/imagesRoutes.js
const express = require('express');
const {
  createImage,
  getImages,
  getImageById,
  updateImage,
  deleteImage,
  patchImage,
} = require('../controllers/imageController');
const { authenticate, requireAdminOrAbove } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const { logActivity } = require('../middlewares/activityLogger');
const { checkSubscriptionLimits } = require('../middlewares/subscriptionLimits');
const { addMissingImageFields } = require('../utils/fixImageModel');
const router = express.Router();

// Unified Image Management Routes for All Roles (permissions handled in controller)
router.post('/', authenticate, checkSubscriptionLimits, logActivity('image_upload', 'image'), upload.single('image'), addMissingImageFields, createImage);
router.get('/', authenticate, getImages); // Supports ?own=true to see only user's images
router.get('/:id', authenticate, getImageById);
router.put('/:id', authenticate, logActivity('image_update', 'image'), upload.single('image'), updateImage);
router.delete('/:id', authenticate, logActivity('image_delete', 'image'), deleteImage);
router.patch('/:id', authenticate, logActivity('image_update', 'image'), upload.single('image'), patchImage);

// Retrieve specific size variant (generates on-demand if missing)
const { streamSize } = require('../controllers/imageProcessingController');
router.get('/:id/size/:size', authenticate, streamSize);

// Public image resize endpoints (no auth required)
router.get('/:id/public/thumbnail', async (req, res) => {
  try {
    const Image = require('../models/image');
    const sharp = require('sharp');
    const fs = require('fs');
    const path = require('path');
    
    const image = await Image.findById(req.params.id);
    if (!image || image.visibility !== 'public') {
      return res.status(404).json({ success: false, message: 'Public image not found' });
    }
    
    const imagePath = path.join(__dirname, '..', '..', image.internalPath);
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({ success: false, message: 'Image file not found' });
    }
    
    const resizedBuffer = await sharp(imagePath)
      .resize(150, 150, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toBuffer();
    
    res.set({
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'public, max-age=86400'
    });
    res.send(resizedBuffer);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id/public/medium', async (req, res) => {
  try {
    const Image = require('../models/image');
    const sharp = require('sharp');
    const fs = require('fs');
    const path = require('path');
    
    const image = await Image.findById(req.params.id);
    if (!image || image.visibility !== 'public') {
      return res.status(404).json({ success: false, message: 'Public image not found' });
    }
    
    const imagePath = path.join(__dirname, '..', '..', image.internalPath);
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({ success: false, message: 'Image file not found' });
    }
    
    const resizedBuffer = await sharp(imagePath)
      .resize(800, 600, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();
    
    res.set({
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'public, max-age=86400'
    });
    res.send(resizedBuffer);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Image resize endpoints for download (authenticated)
router.get('/:id/thumbnail', authenticate, async (req, res) => {
  try {
    const Image = require('../models/image');
    const sharp = require('sharp');
    const fs = require('fs');
    const path = require('path');
    
    const image = await Image.findById(req.params.id);
    if (!image) {
      return res.status(404).json({ success: false, message: 'Image not found' });
    }
    
    const imagePath = path.join(__dirname, '..', '..', image.internalPath);
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({ success: false, message: 'Image file not found' });
    }
    
    const resizedBuffer = await sharp(imagePath)
      .resize(150, 150, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toBuffer();
    
    res.set({
      'Content-Type': 'image/jpeg',
      'Content-Disposition': `attachment; filename="${image.title || 'image'}_thumbnail.jpg"`
    });
    res.send(resizedBuffer);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id/medium', authenticate, async (req, res) => {
  try {
    const Image = require('../models/image');
    const sharp = require('sharp');
    const fs = require('fs');
    const path = require('path');
    
    const image = await Image.findById(req.params.id);
    if (!image) {
      return res.status(404).json({ success: false, message: 'Image not found' });
    }
    
    const imagePath = path.join(__dirname, '..', '..', image.internalPath);
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({ success: false, message: 'Image file not found' });
    }
    
    const resizedBuffer = await sharp(imagePath)
      .resize(800, 600, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();
    
    res.set({
      'Content-Type': 'image/jpeg',
      'Content-Disposition': `attachment; filename="${image.title || 'image'}_medium.jpg"`
    });
    res.send(resizedBuffer);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id/large', authenticate, async (req, res) => {
  try {
    const Image = require('../models/image');
    const sharp = require('sharp');
    const fs = require('fs');
    const path = require('path');
    
    const image = await Image.findById(req.params.id);
    if (!image) {
      return res.status(404).json({ success: false, message: 'Image not found' });
    }
    
    const imagePath = path.join(__dirname, '..', '..', image.internalPath);
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({ success: false, message: 'Image file not found' });
    }
    
    const resizedBuffer = await sharp(imagePath)
      .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 90 })
      .toBuffer();
    
    res.set({
      'Content-Type': 'image/jpeg',
      'Content-Disposition': `attachment; filename="${image.title || 'image'}_large.jpg"`
    });
    res.send(resizedBuffer);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
