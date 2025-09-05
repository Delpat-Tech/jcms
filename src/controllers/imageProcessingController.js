// controllers/imageProcessingController.js
const Image = require('../models/image');
const { generateMultipleSizes, convertImageFormat } = require('../services/imageService');
const { safeDeleteFile } = require('../utils/safeDeleteFile');
const fs = require('fs');
const path = require('path');

// Generate multiple sizes for existing image
const generateSizes = async (req, res) => {
  try {
    const { id } = req.params;
    const { format = 'webp' } = req.body;
    
    const image = await Image.findById(id);
    if (!image) {
      return res.status(404).json({ success: false, message: 'Image not found' });
    }
    
    // Check ownership
    const User = require('../models/user');
    const currentUser = await User.findById(req.user.id).populate('role');
    const isAdminOrAbove = ['admin', 'superadmin'].includes(currentUser.role.name);
    
    if (!isAdminOrAbove && image.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    const inputBuffer = fs.readFileSync(image.internalPath);
    const outputDir = path.dirname(image.internalPath);
    const baseName = path.parse(image.internalPath).name;
    
    const sizes = await generateMultipleSizes(inputBuffer, outputDir, baseName, format);
    
    // Generate URLs for each size
    const sizeUrls = {};
    for (const [sizeName, sizeData] of Object.entries(sizes)) {
      sizeUrls[sizeName] = `${req.protocol}://${req.get('host')}/${sizeData.path}`;
    }
    
    res.status(200).json({ 
      success: true, 
      message: 'Multiple sizes generated successfully',
      data: {
        original: image.fileUrl,
        sizes: sizeUrls
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error generating sizes', 
      error: error.message 
    });
  }
};

// Convert image format
const convertFormat = async (req, res) => {
  try {
    const { id } = req.params;
    const { format } = req.body;
    
    if (!format) {
      return res.status(400).json({ success: false, message: 'Format is required' });
    }
    
    const image = await Image.findById(id);
    if (!image) {
      return res.status(404).json({ success: false, message: 'Image not found' });
    }
    
    // Check ownership
    const User = require('../models/user');
    const currentUser = await User.findById(req.user.id).populate('role');
    const isAdminOrAbove = ['admin', 'superadmin'].includes(currentUser.role.name);
    
    if (!isAdminOrAbove && image.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    const newPath = await convertImageFormat(image.internalPath, format);
    const newUrl = `${req.protocol}://${req.get('host')}/${newPath}`;
    
    // Delete old file if format changed
    if (image.format !== format) {
      await safeDeleteFile(image.internalPath);
    }
    
    // Update image record
    const updatedImage = await Image.findByIdAndUpdate(id, {
      format,
      internalPath: newPath,
      fileUrl: newUrl
    }, { new: true, select: '-_id' });
    
    res.status(200).json({ 
      success: true, 
      message: 'Format converted successfully',
      data: updatedImage
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error converting format', 
      error: error.message 
    });
  }
};

// Generate specific size for existing image
const generateSpecificSize = async (req, res) => {
  try {
    const { id } = req.params;
    const { size, format = 'webp' } = req.body;
    
    if (!size || !['thumbnail', 'medium', 'large'].includes(size)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Size must be: thumbnail, medium, or large' 
      });
    }
    
    const image = await Image.findById(id);
    if (!image) {
      return res.status(404).json({ success: false, message: 'Image not found' });
    }
    
    // Check ownership
    const User = require('../models/user');
    const currentUser = await User.findById(req.user.id).populate('role');
    const isAdminOrAbove = ['admin', 'superadmin'].includes(currentUser.role.name);
    
    if (!isAdminOrAbove && image.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    const inputBuffer = fs.readFileSync(image.internalPath);
    const outputDir = path.dirname(image.internalPath);
    const baseName = path.parse(image.internalPath).name;
    
    const sizes = await generateMultipleSizes(inputBuffer, outputDir, baseName, format);
    const requestedSize = sizes[size];
    const sizeUrl = `${req.protocol}://${req.get('host')}/${requestedSize.path}`;
    
    res.status(200).json({ 
      success: true, 
      message: `${size} size generated successfully`,
      data: {
        size,
        width: requestedSize.width,
        url: sizeUrl,
        format
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error generating size', 
      error: error.message 
    });
  }
};

module.exports = {
  generateSizes,
  generateSpecificSize,
  convertFormat
};