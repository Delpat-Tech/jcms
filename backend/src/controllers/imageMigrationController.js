// controllers/imageMigrationController.js - Help find and organize existing images
const Image = require('../models/image');
const ImageCollection = require('../models/imageCollection');

/**
 * Find all unorganized images (not in any collection)
 */
const findUnorganizedImages = async (req, res) => {
  try {
    console.log('Finding unorganized images for user:', req.user.id);
    
    // Find images that don't belong to any collection
    const unorganizedImages = await Image.find({
      user: req.user.id,
      collection: { $in: [null, undefined] }
    }).populate('user', 'username email').lean();
    
    console.log('Found unorganized images:', unorganizedImages.length);
    
    // Format the images for display
    const formattedImages = unorganizedImages.map(image => ({
      id: image._id,
      title: image.title,
      filename: image.filename || image.title,
      format: image.format,
      fileSize: image.fileSize,
      formattedSize: formatFileSize(image.fileSize),
      uploadDate: image.createdAt || image.uploadDate,
      fileUrl: image.fileUrl,
      visibility: image.visibility || 'private'
    }));
    
    res.json({
      success: true,
      data: {
        unorganizedImages: formattedImages,
        count: formattedImages.length,
        message: formattedImages.length > 0 
          ? `Found ${formattedImages.length} unorganized image(s)` 
          : 'All images are organized in collections'
      }
    });
    
  } catch (error) {
    console.error('Error finding unorganized images:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to find unorganized images',
      error: error.message
    });
  }
};

/**
 * Create a collection and move images to it
 */
const createCollectionWithImages = async (req, res) => {
  try {
    const { collectionName, imageIds, description = '' } = req.body;
    
    if (!collectionName || !imageIds || !Array.isArray(imageIds)) {
      return res.status(400).json({
        success: false,
        message: 'Collection name and image IDs are required'
      });
    }
    
    console.log('Creating collection:', collectionName, 'with', imageIds.length, 'images');
    
    // Generate slug
    const slug = collectionName.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-') + '-' + Date.now().toString(36).slice(-4);
    
    // Create the collection
    const collection = await ImageCollection.create({
      name: collectionName,
      description,
      slug,
      user: req.user.id,
      tenant: req.user.tenant ? req.user.tenant._id : null,
      tenantName: req.user.tenant ? req.user.tenant.name : 'System',
      tags: [],
      stats: {
        totalImages: imageIds.length,
        totalSize: 0,
        publicImages: 0,
        privateImages: imageIds.length
      }
    });
    
    // Move images to the collection
    const updateResult = await Image.updateMany(
      { 
        _id: { $in: imageIds },
        user: req.user.id
      },
      { 
        collection: collection._id 
      }
    );
    
    console.log('Updated', updateResult.modifiedCount, 'images');
    
    // Calculate total size
    const images = await Image.find({ _id: { $in: imageIds } });
    const totalSize = images.reduce((sum, img) => sum + (img.fileSize || 0), 0);
    
    // Update collection stats
    await ImageCollection.findByIdAndUpdate(collection._id, {
      'stats.totalSize': totalSize
    });
    
    res.json({
      success: true,
      data: {
        collection,
        movedImages: updateResult.modifiedCount,
        totalSize: formatFileSize(totalSize),
        message: `Created collection "${collectionName}" and moved ${updateResult.modifiedCount} image(s)`
      }
    });
    
  } catch (error) {
    console.error('Error creating collection with images:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create collection with images',
      error: error.message
    });
  }
};

/**
 * Get all collections with image counts
 */
const getCollectionsWithCounts = async (req, res) => {
  try {
    console.log('Getting collections with counts for user:', req.user.id);
    
    // Build query based on user role
    let query = {};
    const userRole = req.user.role && req.user.role.name ? req.user.role.name : 'editor';
    
    if (userRole !== 'superadmin') {
      query.tenant = req.user.tenant ? req.user.tenant._id : null;
      if (userRole !== 'admin') {
        query.user = req.user.id;
      }
    }
    
    const collections = await ImageCollection.find(query)
      .populate('user', 'username email')
      .lean();
    
    // Get image counts for each collection
    const collectionsWithCounts = await Promise.all(
      collections.map(async (collection) => {
        const imageCount = await Image.countDocuments({ collection: collection._id });
        return {
          ...collection,
          imageCount,
          formattedStats: {
            totalImages: collection.stats?.totalImages || imageCount,
            formattedSize: formatFileSize(collection.stats?.totalSize || 0)
          }
        };
      })
    );
    
    res.json({
      success: true,
      data: {
        collections: collectionsWithCounts,
        count: collectionsWithCounts.length
      }
    });
    
  } catch (error) {
    console.error('Error getting collections with counts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get collections',
      error: error.message
    });
  }
};

// Helper function
function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

module.exports = {
  findUnorganizedImages,
  createCollectionWithImages,
  getCollectionsWithCounts
};
