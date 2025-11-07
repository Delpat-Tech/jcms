// controllers/enhancedImageController.js
const imageManagementService = require('../services/imageManagementService');
const cloudflareR2Service = require('../services/cloudflareR2Service');
const Image = require('../models/image');
const User = require('../models/user');
const logger = require('../config/logger');

/**
 * Enhanced image upload with metadata extraction and processing
 */
const uploadImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No images uploaded' 
      });
    }

    // Check file size limits based on subscription
    const maxFileSize = req.subscriptionLimits.maxFileSize;
    const oversizedFiles = req.files.filter(file => file.size > maxFileSize);
    
    if (oversizedFiles.length > 0) {
      const maxSizeMB = Math.floor(maxFileSize / (1024 * 1024));
      const planType = req.hasActiveSubscription ? 'subscribed' : 'free';
      
      return res.status(400).json({
        success: false,
        message: `File size limit exceeded. ${planType} users can upload files up to ${maxSizeMB}MB. ${req.hasActiveSubscription ? '' : 'Upgrade to premium for 100MB limit.'}`,
        oversizedFiles: oversizedFiles.map(f => ({ name: f.originalname, size: f.size }))
      });
    }

    const {
      title,
      project,
      tags,
      notes,
      format = 'webp',
      quality = 80
    } = req.body;

    // Parse tags if it's a string
    let parsedTags = [];
    if (tags) {
      try {
        parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
      } catch (error) {
        parsedTags = typeof tags === 'string' ? tags.split(',').map(t => t.trim()) : [];
      }
    }

    // Parse notes if it's a string
    let parsedNotes = {};
    if (notes) {
      try {
        parsedNotes = typeof notes === 'string' ? JSON.parse(notes) : notes;
      } catch (error) {
        parsedNotes = { description: notes };
      }
    }

    const results = {
      success: [],
      failed: [],
      summary: {
        totalUploaded: 0,
        totalSize: 0,
        formats: new Set(),
        errors: []
      }
    };

    // Process each uploaded file
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const fileTitle = title || `${file.originalname} ${i + 1}`;

      try {
        const result = await imageManagementService.processAndStoreImage(
          file,
          req.user,
          {
            title: fileTitle,
            project,
            tags: parsedTags,
            notes: parsedNotes,
            format,
            quality: parseInt(quality),
            subscriptionLimits: req.subscriptionLimits
          }
        );

        results.success.push({
          id: result.image._id,
          title: result.image.title,
          filename: result.image.filename,
          size: result.image.fileSize,
          format: result.image.format,
          dimensions: result.metadata.dimensions,
          compressionRatio: result.metadata.compressionRatio,
          url: result.image.fileUrl
        });

        results.summary.totalUploaded++;
        results.summary.totalSize += result.image.fileSize;
        results.summary.formats.add(result.image.format);

      } catch (error) {
        logger.error('Failed to process image upload', {
          filename: file.originalname,
          error: error.message
        });

        results.failed.push({
          filename: file.originalname,
          error: error.message
        });
        results.summary.errors.push(error.message);
      }
    }

    // Convert Set to Array for JSON response
    results.summary.formats = Array.from(results.summary.formats);
    results.summary.formattedSize = imageManagementService.formatFileSize(results.summary.totalSize);

    const statusCode = results.failed.length === 0 ? 201 : 207; // 207 Multi-Status for partial success

    res.status(statusCode).json({
      success: results.failed.length === 0,
      message: `${results.success.length} image(s) uploaded successfully${results.failed.length > 0 ? `, ${results.failed.length} failed` : ''}`,
      data: results
    });

  } catch (error) {
    logger.error('Image upload controller error', {
      error: error.message,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to upload images',
      error: error.message
    });
  }
};

/**
 * Get images for content management page
 */
const getContentPageImages = async (req, res) => {
  try {
    const filters = {
      project: req.query.project,
      visibility: req.query.visibility,
      tags: req.query.tags ? req.query.tags.split(',') : undefined,
      search: req.query.search,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo
    };

    const pagination = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      sortBy: req.query.sortBy || 'createdAt',
      sortOrder: req.query.sortOrder || 'desc'
    };

    const result = await imageManagementService.getImagesForContentPage(
      req.user,
      filters,
      pagination
    );

    console.log('GET Images:', { count: result.images?.length || 0, total: result.pagination?.total || 0 });

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('Failed to get content page images', {
      error: error.message,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve images',
      error: error.message
    });
  }
};

/**
 * Make selected images public (Go Public functionality)
 */
const makeImagesPublic = async (req, res) => {
  try {
    const { imageIds } = req.body;

    if (!Array.isArray(imageIds) || imageIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of image IDs'
      });
    }

    if (!cloudflareR2Service.isConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'Cloudflare R2 is not configured. Cannot make images public.',
        code: 'R2_NOT_CONFIGURED'
      });
    }

    const result = await imageManagementService.makeImagesPublic(imageIds, req.user);

    const statusCode = result.failed.length === 0 ? 200 : 207; // 207 Multi-Status for partial success

    res.status(statusCode).json({
      success: result.failed.length === 0,
      message: `${result.success.length} image(s) made public${result.failed.length > 0 ? `, ${result.failed.length} failed` : ''}`,
      data: {
        publicUrls: result.publicUrls,
        summary: {
          successful: result.success.length,
          failed: result.failed.length,
          total: imageIds.length
        },
        details: {
          success: result.success,
          failed: result.failed
        }
      }
    });

  } catch (error) {
    logger.error('Failed to make images public', {
      error: error.message,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to make images public',
      error: error.message
    });
  }
};

/**
 * Make selected images private
 */
const makeImagesPrivate = async (req, res) => {
  try {
    const { imageIds } = req.body;

    if (!Array.isArray(imageIds) || imageIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of image IDs'
      });
    }

    const result = await imageManagementService.makeImagesPrivate(imageIds, req.user);

    const statusCode = result.failed.length === 0 ? 200 : 207;

    res.status(statusCode).json({
      success: result.failed.length === 0,
      message: `${result.success.length} image(s) made private${result.failed.length > 0 ? `, ${result.failed.length} failed` : ''}`,
      data: {
        summary: {
          successful: result.success.length,
          failed: result.failed.length,
          total: imageIds.length
        },
        details: {
          success: result.success,
          failed: result.failed
        }
      }
    });

  } catch (error) {
    logger.error('Failed to make images private', {
      error: error.message,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to make images private',
      error: error.message
    });
  }
};

/**
 * Get image by ID with access tracking
 */
const getImageById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const image = await Image.findById(id)
      .populate('user', 'username email')
      .populate('project', 'title slug');

    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    // Check access permissions
    if (!imageManagementService.canUserAccessImage(image, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Track access (async, don't wait)
    imageManagementService.trackImageAccess(id).catch(error => {
      logger.error('Failed to track image access', { imageId: id, error: error.message });
    });

    // Add computed fields
    const enhancedImage = {
      ...image.toObject(),
      accessUrl: image.visibility === 'public' && image.cloudflareUrl 
        ? image.cloudflareUrl 
        : image.fileUrl,
      formattedSize: imageManagementService.formatFileSize(image.fileSize),
      isPublic: image.visibility === 'public',
      canMakePublic: cloudflareR2Service.isConfigured(),
      daysSinceUpload: Math.floor((Date.now() - new Date(image.createdAt).getTime()) / (1000 * 60 * 60 * 24))
    };

    res.json({
      success: true,
      data: enhancedImage
    });

  } catch (error) {
    logger.error('Failed to get image by ID', {
      imageId: req.params.id,
      error: error.message,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve image',
      error: error.message
    });
  }
};

/**
 * Update image metadata
 */
const updateImageMetadata = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, tags, notes, project } = req.body;

    const image = await Image.findById(id);
    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    // Check permissions
    if (!imageManagementService.canUserAccessImage(image, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (tags !== undefined) updateData.tags = Array.isArray(tags) ? tags : [];
    if (notes !== undefined) updateData.notes = notes;
    if (project !== undefined) updateData.project = project;

    const updatedImage = await Image.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate('user', 'username email').populate('project', 'title slug');

    res.json({
      success: true,
      message: 'Image metadata updated successfully',
      data: updatedImage
    });

  } catch (error) {
    logger.error('Failed to update image metadata', {
      imageId: req.params.id,
      error: error.message,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to update image metadata',
      error: error.message
    });
  }
};

/**
 * Delete images
 */
const deleteImages = async (req, res) => {
  try {
    const { imageIds } = req.body;

    if (!Array.isArray(imageIds) || imageIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of image IDs'
      });
    }

    const results = {
      success: [],
      failed: []
    };

    for (const imageId of imageIds) {
      try {
        const image = await Image.findById(imageId);
        if (!image) {
          results.failed.push({ imageId, error: 'Image not found' });
          continue;
        }

        // Check permissions
        if (!imageManagementService.canUserAccessImage(image, req.user)) {
          results.failed.push({ imageId, error: 'Access denied' });
          continue;
        }

        // Delete from Cloudflare R2 if exists
        if (image.cloudflareKey && cloudflareR2Service.isConfigured()) {
          await cloudflareR2Service.deleteFile(image.cloudflareKey);
        }

        // Delete local file
        const fs = require('fs');
        if (image.internalPath && fs.existsSync(image.internalPath)) {
          fs.unlinkSync(image.internalPath);
        }

        // Delete from database
        await Image.findByIdAndDelete(imageId);

        results.success.push({ imageId });

        logger.info('Image deleted successfully', { imageId });

      } catch (error) {
        logger.error('Failed to delete image', {
          imageId,
          error: error.message
        });
        
        results.failed.push({
          imageId,
          error: error.message
        });
      }
    }

    const statusCode = results.failed.length === 0 ? 200 : 207;

    res.status(statusCode).json({
      success: results.failed.length === 0,
      message: `${results.success.length} image(s) deleted${results.failed.length > 0 ? `, ${results.failed.length} failed` : ''}`,
      data: {
        summary: {
          successful: results.success.length,
          failed: results.failed.length,
          total: imageIds.length
        },
        details: {
          success: results.success,
          failed: results.failed
        }
      }
    });

  } catch (error) {
    logger.error('Failed to delete images', {
      error: error.message,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to delete images',
      error: error.message
    });
  }
};

/**
 * Get Cloudflare R2 configuration status
 */
const getR2Status = async (req, res) => {
  try {
    const isConfigured = cloudflareR2Service.isConfigured();
    
    res.json({
      success: true,
      data: {
        configured: isConfigured,
        canMakePublic: isConfigured,
        message: isConfigured 
          ? 'Cloudflare R2 is configured and ready'
          : 'Cloudflare R2 is not configured. Public image functionality is disabled.'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to check R2 status',
      error: error.message
    });
  }
};

/**
 * Get image analytics and statistics
 */
const getImageAnalytics = async (req, res) => {
  try {
    // Build base query for user's accessible images
    let baseQuery = {};
    
    if (req.user.role.name !== 'superadmin') {
      baseQuery.tenant = req.user.tenant ? req.user.tenant._id : null;
      
      if (req.user.role.name !== 'admin') {
        baseQuery.user = req.user.id;
      }
    }

    const [
      totalImages,
      publicImages,
      privateImages,
      totalSize,
      formatStats,
      recentUploads,
      topAccessedImages
    ] = await Promise.all([
      Image.countDocuments(baseQuery),
      Image.countDocuments({ ...baseQuery, visibility: 'public' }),
      Image.countDocuments({ ...baseQuery, visibility: 'private' }),
      Image.aggregate([
        { $match: baseQuery },
        { $group: { _id: null, totalSize: { $sum: '$fileSize' } } }
      ]),
      Image.aggregate([
        { $match: baseQuery },
        { $group: { _id: '$format', count: { $sum: 1 }, totalSize: { $sum: '$fileSize' } } },
        { $sort: { count: -1 } }
      ]),
      Image.find(baseQuery)
        .sort({ createdAt: -1 })
        .limit(5)
        .select('title filename createdAt fileSize format visibility'),
      Image.find({ ...baseQuery, accessCount: { $gt: 0 } })
        .sort({ accessCount: -1 })
        .limit(5)
        .select('title filename accessCount lastAccessed visibility')
    ]);

    const analytics = {
      summary: {
        totalImages,
        publicImages,
        privateImages,
        totalSize: totalSize[0]?.totalSize || 0,
        formattedTotalSize: imageManagementService.formatFileSize(totalSize[0]?.totalSize || 0),
        r2Configured: cloudflareR2Service.isConfigured()
      },
      formats: formatStats.map(stat => ({
        format: stat._id,
        count: stat.count,
        totalSize: stat.totalSize,
        formattedSize: imageManagementService.formatFileSize(stat.totalSize),
        percentage: totalImages > 0 ? ((stat.count / totalImages) * 100).toFixed(1) : 0
      })),
      recentUploads: recentUploads.map(image => ({
        ...image.toObject(),
        formattedSize: imageManagementService.formatFileSize(image.fileSize),
        daysSinceUpload: Math.floor((Date.now() - new Date(image.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      })),
      topAccessed: topAccessedImages.map(image => ({
        ...image.toObject(),
        lastAccessedFormatted: image.lastAccessed 
          ? new Date(image.lastAccessed).toLocaleDateString()
          : 'Never'
      }))
    };

    res.json({
      success: true,
      data: analytics
    });

  } catch (error) {
    logger.error('Failed to get image analytics', {
      error: error.message,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve analytics',
      error: error.message
    });
  }
};

module.exports = {
  uploadImages,
  getContentPageImages,
  makeImagesPublic,
  makeImagesPrivate,
  getImageById,
  updateImageMetadata,
  deleteImages,
  getR2Status,
  getImageAnalytics
};
