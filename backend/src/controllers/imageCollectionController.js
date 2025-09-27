// controllers/imageCollectionController.js
const imageCollectionService = require('../services/imageCollectionService');
const logger = require('../config/logger');

/**
 * Create new image collection
 */
const createCollection = async (req, res) => {
  try {
    const { name, description, tags, project } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Collection name is required'
      });
    }

    const collection = await imageCollectionService.createCollection(
      { name: name.trim(), description, tags, project },
      req.user
    );

    res.status(201).json({
      success: true,
      message: 'Collection created successfully',
      data: collection
    });

  } catch (error) {
    logger.error('Failed to create collection', {
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

/**
 * Get all collections for user
 */
const getCollections = async (req, res) => {
  try {
    const filters = {
      search: req.query.search,
      visibility: req.query.visibility,
      tags: req.query.tags ? req.query.tags.split(',') : undefined,
      project: req.query.project,
      sortBy: req.query.sortBy || 'createdAt',
      sortOrder: req.query.sortOrder || 'desc'
    };

    const collections = await imageCollectionService.getCollections(req.user, filters);

    res.json({
      success: true,
      data: collections
    });

  } catch (error) {
    logger.error('Failed to get collections', {
      error: error.message,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve collections',
      error: error.message
    });
  }
};

/**
 * Get collection by ID with images
 */
const getCollectionById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const imageFilters = {
      search: req.query.search,
      visibility: req.query.visibility,
      tags: req.query.tags ? req.query.tags.split(',') : undefined,
      sortBy: req.query.sortBy || 'createdAt',
      sortOrder: req.query.sortOrder || 'desc',
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20
    };

    const result = await imageCollectionService.getCollectionById(id, req.user, imageFilters);
    
    // Get files in this collection
    const File = require('../models/file');
    const files = await File.find({ collection: id }).lean();
    
    // Clean up the images data
    const cleanImages = result.images.map((image, index) => ({
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
          _id: result.collection._id,
          name: result.collection.name,
          description: result.collection.description
        },
        images: allItems // Keep same field name for compatibility
      }
    });

  } catch (error) {
    logger.error('Failed to get collection by ID', {
      collectionId: req.params.id,
      error: error.message,
      userId: req.user?.id
    });

    const statusCode = error.message.includes('not found') || error.message.includes('access denied') ? 404 : 500;
    
    res.status(statusCode).json({
      success: false,
      message: error.message,
      error: error.message
    });
  }
};

/**
 * Make collection public (Go Public for entire collection)
 */
const makeCollectionPublic = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await imageCollectionService.makeCollectionPublic(id, req.user);

    const statusCode = result.success ? 200 : 207; // 207 Multi-Status for partial success

    res.status(statusCode).json({
      success: result.success,
      message: result.message,
      data: {
        publicUrls: result.results?.publicUrls || [],
        collectionUrl: result.collectionUrl,
        summary: {
          successful: result.results?.success?.length || 0,
          failed: result.results?.failed?.length || 0
        },
        details: result.results
      }
    });

  } catch (error) {
    logger.error('Failed to make collection public', {
      collectionId: req.params.id,
      error: error.message,
      userId: req.user?.id
    });

    const statusCode = error.message.includes('not configured') ? 503 : 500;

    res.status(statusCode).json({
      success: false,
      message: error.message,
      error: error.message
    });
  }
};

/**
 * Make collection private
 */
const makeCollectionPrivate = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await imageCollectionService.makeCollectionPrivate(id, req.user);

    const statusCode = result.success ? 200 : 207;

    res.status(statusCode).json({
      success: result.success,
      message: result.message,
      data: {
        summary: {
          successful: result.results?.success?.length || 0,
          failed: result.results?.failed?.length || 0
        },
        details: result.results
      }
    });

  } catch (error) {
    logger.error('Failed to make collection private', {
      collectionId: req.params.id,
      error: error.message,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      message: error.message,
      error: error.message
    });
  }
};

/**
 * Add images to collection
 */
const addImagesToCollection = async (req, res) => {
  try {
    const { id } = req.params;
    const { imageIds } = req.body;

    if (!Array.isArray(imageIds) || imageIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of image IDs'
      });
    }

    const result = await imageCollectionService.addImagesToCollection(id, imageIds, req.user);

    res.json({
      success: true,
      message: result.message,
      data: {
        modifiedCount: result.modifiedCount
      }
    });

  } catch (error) {
    logger.error('Failed to add images to collection', {
      collectionId: req.params.id,
      error: error.message,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      message: error.message,
      error: error.message
    });
  }
};

/**
 * Add files to collection
 */
const addFilesToCollection = async (req, res) => {
  try {
    const { id } = req.params;
    const { fileIds } = req.body;

    if (!Array.isArray(fileIds) || fileIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of file IDs'
      });
    }

    // Get collection with access check
    const collection = await imageCollectionService.getCollectionAccess(id, req.user);

    const File = require('../models/file');
    const result = await File.updateMany(
      { _id: { $in: fileIds } },
      { collection: id }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} file(s) added to collection`,
      data: {
        modifiedCount: result.modifiedCount
      }
    });

  } catch (error) {
    logger.error('Failed to add files to collection', {
      collectionId: req.params.id,
      error: error.message,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      message: error.message,
      error: error.message
    });
  }
};

/**
 * Update collection metadata
 */
const updateCollection = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, tags, coverImage } = req.body;

    // Get collection with access check
    const collection = await imageCollectionService.getCollectionAccess(id, req.user);

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description;
    if (tags !== undefined) updateData.tags = Array.isArray(tags) ? tags : [];
    if (coverImage !== undefined) updateData.coverImage = coverImage;

    // Update slug if name changed
    if (name && name.trim() !== collection.name) {
      updateData.slug = imageCollectionService.generateSlug(name.trim());
    }

    const ImageCollection = require('../models/imageCollection');
    const updatedCollection = await ImageCollection.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate('user', 'username email').populate('project', 'title');

    res.json({
      success: true,
      message: 'Collection updated successfully',
      data: updatedCollection
    });

  } catch (error) {
    logger.error('Failed to update collection', {
      collectionId: req.params.id,
      error: error.message,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      message: error.message,
      error: error.message
    });
  }
};

/**
 * Delete collection
 */
const deleteCollection = async (req, res) => {
  try {
    const { id } = req.params;

    // Get collection with access check
    const collection = await imageCollectionService.getCollectionAccess(id, req.user);

    // Check if collection has images
    const Image = require('../models/image');
    const imageCount = await Image.countDocuments({ 
      $or: [
        { collection: id },
        { collections: id }
      ]
    });

    if (imageCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete collection. It contains ${imageCount} image(s). Please move or delete the images first.`
      });
    }

    // Delete collection
    const ImageCollection = require('../models/imageCollection');
    await ImageCollection.findByIdAndDelete(id);

    logger.info('Collection deleted', {
      collectionId: id,
      name: collection.name,
      userId: req.user.id
    });

    res.json({
      success: true,
      message: 'Collection deleted successfully'
    });

  } catch (error) {
    logger.error('Failed to delete collection', {
      collectionId: req.params.id,
      error: error.message,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      message: error.message,
      error: error.message
    });
  }
};

/**
 * Get collection in unified JSON format
 */
const getCollectionJson = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await imageCollectionService.getCollectionById(id, req.user, {});
    const { collection, images } = result;

    // Transform to unified JSON format with only essential fields
    const unifiedJson = {
      collectionId: String(collection._id),
      name: collection.name || '',
      description: collection.description || '',
      tenant: String(collection.tenant || ''),
      settings: {
        allowPublicAccess: collection.visibility === 'public',
        downloadEnabled: true,
        watermarkEnabled: false
      },
      items: images.map((image, index) => ({
        index: index + 1,
        title: image.title || '',
        fileUrl: image.fileUrl || image.publicUrl || '',
        notes: image.notes || ''
      }))
    };

    res.json(unifiedJson);

  } catch (error) {
    logger.error('Failed to get collection JSON', {
      collectionId: req.params.id,
      error: error.message,
      userId: req.user?.id
    });

    const statusCode = error.message.includes('not found') || error.message.includes('access denied') ? 404 : 500;
    
    res.status(statusCode).json({
      success: false,
      message: error.message,
      error: error.message
    });
  }
};

module.exports = {
  createCollection,
  getCollections,
  getCollectionById,
  makeCollectionPublic,
  makeCollectionPrivate,
  addImagesToCollection,
  addFilesToCollection,
  updateCollection,
  deleteCollection,
  getCollectionJson
};
