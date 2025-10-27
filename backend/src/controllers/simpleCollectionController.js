// controllers/simpleCollectionController.js - Temporary simple controller for testing
const ImageCollection = require('../models/imageCollection');
const logger = require('../config/logger');

/**
 * Simple get collections - just return basic data without complex processing
 */
const getCollections = async (req, res) => {
  try {
    console.log('Simple collections endpoint called');
    
    // Build basic query
    let query = {};
    
    // Apply basic user/tenant filtering
    const userRole = req.user.role && req.user.role.name ? req.user.role.name : 'editor';
    
    if (userRole !== 'superadmin') {
      query.tenant = req.user.tenant ? req.user.tenant._id : null;
      
      if (userRole !== 'admin') {
        query.user = req.user.id;
      }
    }
    
    console.log('Query:', query);
    console.log('User:', { id: req.user.id, role: userRole, tenant: req.user.tenant?._id });
    
    // Get collections without complex processing
    const collections = await ImageCollection.find(query)
      .populate('user', 'username email')
      .lean();
    
    console.log('Found collections:', collections.length);
    
    // Get actual image counts for each collection
    const Image = require('../models/image');
    const simpleCollections = await Promise.all(collections.map(async (collection) => {
      const images = await Image.find({ 
        $or: [
          { collection: collection._id },
          { collections: collection._id }
        ]
      }).lean();
      const totalImages = images.length;
      const totalSize = images.reduce((sum, img) => sum + (img.fileSize || 0), 0);
      const publicImages = images.filter(img => img.visibility === 'public').length;
      const privateImages = totalImages - publicImages;
      
      // Get recent images for preview
      const recentImages = images.slice(0, 4).map(img => ({
        _id: img._id,
        fileUrl: img.fileUrl,
        title: img.title
      }));
      
      return {
        ...collection,
        stats: {
          totalImages,
          totalSize,
          publicImages,
          privateImages
        },
        recentImages,
        formattedSize: formatFileSize(totalSize),
        canMakePublic: totalImages > 0
      };
    }));
    
    // Helper function to format file size
    function formatFileSize(bytes) {
      if (!bytes) return '0 B';
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    }

    res.json({
      success: true,
      data: simpleCollections
    });

  } catch (error) {
    console.error('Simple collections error:', error);
    logger.error('Failed to get collections (simple)', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve collections (simple)',
      error: error.message
    });
  }
};

/**
 * Simple create collection
 */
const createCollection = async (req, res) => {
  try {
    const { name, description, tags = [] } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Collection name is required'
      });
    }

    // Generate simple slug
    const slug = name.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-') + '-' + Date.now().toString(36).slice(-4);

    const collection = await ImageCollection.create({
      name: name.trim(),
      description: description || '',
      slug,
      user: req.user.id,
      tenant: req.user.tenant ? req.user.tenant._id : null,
      tenantName: req.user.tenant ? req.user.tenant.name : 'System',
      tags: Array.isArray(tags) ? tags : [],
      stats: {
        totalImages: 0,
        totalSize: 0,
        publicImages: 0,
        privateImages: 0
      }
    });

    console.log('Collection created:', collection._id);

    res.status(201).json({
      success: true,
      message: 'Collection created successfully',
      data: collection
    });

  } catch (error) {
    console.error('Create collection error:', error);
    logger.error('Failed to create collection (simple)', {
      error: error.message,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to create collection',
      error: error.message
    });
  }
};

module.exports = {
  getCollections,
  createCollection
};
