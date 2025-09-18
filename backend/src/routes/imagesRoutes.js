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
const router = express.Router();

// Unified Image Management Routes for All Roles (permissions handled in controller)
router.post('/', authenticate, logActivity('image_upload', 'image'), upload.single('image'), createImage);
router.get('/', authenticate, getImages); // Supports ?own=true to see only user's images
router.get('/:id', authenticate, getImageById);
router.put('/:id', authenticate, logActivity('image_update', 'image'), upload.single('image'), updateImage);
router.delete('/:id', authenticate, logActivity('image_delete', 'image'), deleteImage);
router.patch('/:id', authenticate, logActivity('image_update', 'image'), upload.single('image'), patchImage);

// Retrieve specific size variant (generates on-demand if missing)
const { streamSize } = require('../controllers/imageProcessingController');
router.get('/:id/size/:size', authenticate, streamSize);

// Image resize endpoints for download
router.get('/:id/thumbnail', async (req, res) => {
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

router.get('/:id/medium', async (req, res) => {
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

router.get('/:id/large', async (req, res) => {
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
