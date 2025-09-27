// routes/publicContentRoutes.js
const express = require('express');
const { getPublicContentBySlugOrId } = require('../controllers/contentController');
const imageCollectionController = require('../controllers/imageCollectionController');

const router = express.Router();

// Public, no auth
router.get('/content/:idOrSlug', getPublicContentBySlugOrId);

// Public collection access
router.get('/collections/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const ImageCollection = require('../models/imageCollection');
    const Image = require('../models/image');
    const File = require('../models/file');
    
    // Get collection (only public ones)
    const collection = await ImageCollection.findOne({ 
      _id: id, 
      visibility: 'public' 
    }).lean();
    
    if (!collection) {
      return res.status(404).json({
        success: false,
        message: 'Collection not found or not public'
      });
    }
    
    // Get images in this collection
    const images = await Image.find({ 
      $or: [
        { collection: id },
        { collections: id }
      ]
    }).lean();
    
    // Get files in this collection
    const files = await File.find({ collection: id }).lean();
    
    // Clean up the images data
    const cleanImages = images.map((image, index) => ({
      index: index + 1,
      title: image.title || '',
      fileUrl: image.fileUrl || image.publicUrl || '',
      notes: image.notes || '',
      type: 'image'
    }));
    
    // Clean up the files data
    const cleanFiles = files.map((file, index) => ({
      index: cleanImages.length + index + 1,
      title: file.title || '',
      fileUrl: file.fileUrl || '',
      notes: file.notes || '',
      type: file.format === 'json' ? 'json' : 'file',
      format: file.format
    }));
    
    // Combine images and files
    const allItems = [...cleanImages, ...cleanFiles];

    res.json({
      success: true,
      data: {
        collection: {
          _id: collection._id,
          name: collection.name,
          description: collection.description
        },
        images: allItems
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
