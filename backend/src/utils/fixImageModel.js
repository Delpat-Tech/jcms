// utils/fixImageModel.js - Quick fix for image upload compatibility
const Image = require('../models/image');

// Middleware to add missing fields before image creation
const addMissingImageFields = (req, res, next) => {
  // Store original Image.create method
  const originalCreate = Image.create;
  
  // Override Image.create to add missing fields
  Image.create = function(imageData) {
    // Add missing required fields if they don't exist
    const enhancedData = {
      ...imageData,
      filename: imageData.filename || req.file?.originalname || 'unknown.jpg',
      visibility: imageData.visibility || 'private',
      uploadDate: imageData.uploadDate || new Date(),
      metadata: imageData.metadata || {
        width: null,
        height: null,
        aspectRatio: null,
        colorSpace: null,
        hasAlpha: false,
        originalSize: imageData.fileSize || 0,
        compressionRatio: 1.0
      },
      tags: imageData.tags || [],
      accessCount: imageData.accessCount || 0,
      versions: imageData.versions || [{
        format: imageData.format || 'jpg',
        size: imageData.fileSize || 0,
        path: imageData.internalPath || '',
        createdAt: new Date()
      }]
    };
    
    // Restore original method and call it
    Image.create = originalCreate;
    return originalCreate.call(this, enhancedData);
  };
  
  next();
};

module.exports = { addMissingImageFields };
