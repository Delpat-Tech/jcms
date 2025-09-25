// controllers/tunnelController.js
const cloudflareTunnelService = require('../services/cloudflareTunnelService');
const imageCollectionService = require('../services/imageCollectionService');
const Image = require('../models/image');
const ImageCollection = require('../models/imageCollection');
const logger = require('../config/logger');
const archiver = require('archiver');
const fs = require('fs');
const path = require('path');

/**
 * Start Cloudflare Tunnel
 */
const startTunnel = async (req, res) => {
  try {
    logger.info('Starting tunnel request', { userId: req.user.id });

    // Check if cloudflared is available
    const availability = await cloudflareTunnelService.checkCloudflaredAvailability();
    if (!availability.available) {
      return res.status(503).json({
        success: false,
        message: 'Cloudflared not available',
        error: availability.error,
        instructions: 'Please install cloudflared.exe and ensure it\'s in the PATH or set CLOUDFLARED_PATH environment variable'
      });
    }

    const result = await cloudflareTunnelService.startTunnel();

    res.json({
      success: result.success,
      message: result.message,
      data: {
        tunnelUrl: result.tunnelUrl,
        status: cloudflareTunnelService.getStatus()
      }
    });

  } catch (error) {
    logger.error('Failed to start tunnel', {
      error: error.message,
      userId: req.user.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to start tunnel',
      error: error.message
    });
  }
};

/**
 * Stop Cloudflare Tunnel
 */
const stopTunnel = async (req, res) => {
  try {
    const result = await cloudflareTunnelService.stopTunnel();

    res.json({
      success: result.success,
      message: result.message,
      data: {
        status: cloudflareTunnelService.getStatus()
      }
    });

  } catch (error) {
    logger.error('Failed to stop tunnel', {
      error: error.message,
      userId: req.user.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to stop tunnel',
      error: error.message
    });
  }
};

/**
 * Get tunnel status
 */
const getTunnelStatus = async (req, res) => {
  try {
    const status = cloudflareTunnelService.getStatus();
    const availability = await cloudflareTunnelService.checkCloudflaredAvailability();

    res.json({
      success: true,
      data: {
        ...status,
        cloudflaredAvailable: availability.available,
        cloudflaredVersion: availability.version || null,
        message: availability.message
      }
    });

  } catch (error) {
    logger.error('Failed to get tunnel status', {
      error: error.message,
      userId: req.user.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to get tunnel status',
      error: error.message
    });
  }
};

/**
 * Make collection public via tunnel
 */
const makeCollectionPublic = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if tunnel is running
    const tunnelStatus = cloudflareTunnelService.getStatus();
    if (!tunnelStatus.isRunning) {
      return res.status(400).json({
        success: false,
        message: 'Tunnel is not running. Please start the tunnel first.',
        requiresTunnel: true
      });
    }

    // Get collection with access check
    const collection = await imageCollectionService.getCollectionAccess(id, req.user);

    // Get all images in collection
    const images = await Image.find({ 
      collection: id,
      visibility: 'private' // Only process private images
    });

    if (images.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Collection is already public or has no images'
      });
    }

    const results = {
      success: [],
      failed: [],
      publicUrls: []
    };

    // Create public directory for the collection
    await cloudflareTunnelService.createPublicDirectory(collection.name);

    // Copy each image to public directory and update database
    for (const image of images) {
      try {
        const filename = image.filename || `image_${image._id}.${image.format}`;
        
        // Copy image to public directory
        const copyResult = await cloudflareTunnelService.copyImageToPublic(
          image.internalPath,
          collection.name,
          filename
        );

        // Update image record
        await Image.findByIdAndUpdate(image._id, {
          visibility: 'public',
          publicUrl: copyResult.publicUrl,
          publicationDate: new Date(),
          tunnelUrl: copyResult.publicUrl
        });

        results.success.push({
          imageId: image._id,
          title: image.title,
          filename: filename,
          publicUrl: copyResult.publicUrl
        });

        results.publicUrls.push({
          imageId: image._id,
          title: image.title,
          filename: filename,
          publicUrl: copyResult.publicUrl,
          downloadUrl: copyResult.publicUrl // Same URL for download
        });

      } catch (error) {
        logger.error('Failed to make image public via tunnel', {
          imageId: image._id,
          collectionId: id,
          error: error.message
        });
        
        results.failed.push({
          imageId: image._id,
          title: image.title,
          error: error.message
        });
      }
    }

    // Update collection status
    if (results.failed.length === 0) {
      await ImageCollection.findByIdAndUpdate(id, {
        visibility: 'public',
        publicationDate: new Date(),
        tunnelUrl: cloudflareTunnelService.generatePublicUrl(collection.name)
      });
    }

    // Update collection stats
    await imageCollectionService.updateCollectionStats(id);

    logger.info('Collection made public via tunnel', {
      collectionId: id,
      successful: results.success.length,
      failed: results.failed.length
    });

    res.json({
      success: results.failed.length === 0,
      message: `${results.success.length} image(s) made public${results.failed.length > 0 ? `, ${results.failed.length} failed` : ''}`,
      data: {
        tunnelUrl: tunnelStatus.tunnelUrl,
        collectionUrl: cloudflareTunnelService.generatePublicUrl(collection.name),
        publicUrls: results.publicUrls,
        summary: {
          successful: results.success.length,
          failed: results.failed.length
        },
        details: results
      }
    });

  } catch (error) {
    logger.error('Failed to make collection public via tunnel', {
      collectionId: req.params.id,
      error: error.message,
      userId: req.user.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to make collection public',
      error: error.message
    });
  }
};

/**
 * Make collection private (remove from tunnel)
 */
const makeCollectionPrivate = async (req, res) => {
  try {
    const { id } = req.params;

    // Get collection with access check
    const collection = await imageCollectionService.getCollectionAccess(id, req.user);

    // Get all public images in collection
    const images = await Image.find({ 
      collection: id,
      visibility: 'public'
    });

    const results = {
      success: [],
      failed: []
    };

    // Remove each image from public directory and update database
    for (const image of images) {
      try {
        const filename = image.filename || `image_${image._id}.${image.format}`;
        
        // Remove image from public directory
        await cloudflareTunnelService.removeImageFromPublic(collection.name, filename);

        // Update image record
        await Image.findByIdAndUpdate(image._id, {
          visibility: 'private',
          publicUrl: null,
          publicationDate: null,
          tunnelUrl: null
        });

        results.success.push({
          imageId: image._id,
          title: image.title,
          filename: filename
        });

      } catch (error) {
        logger.error('Failed to make image private', {
          imageId: image._id,
          collectionId: id,
          error: error.message
        });
        
        results.failed.push({
          imageId: image._id,
          title: image.title,
          error: error.message
        });
      }
    }

    // Update collection status
    await ImageCollection.findByIdAndUpdate(id, {
      visibility: 'private',
      publicationDate: null,
      tunnelUrl: null
    });

    // Update collection stats
    await imageCollectionService.updateCollectionStats(id);

    res.json({
      success: results.failed.length === 0,
      message: `${results.success.length} image(s) made private${results.failed.length > 0 ? `, ${results.failed.length} failed` : ''}`,
      data: {
        summary: {
          successful: results.success.length,
          failed: results.failed.length
        },
        details: results
      }
    });

  } catch (error) {
    logger.error('Failed to make collection private', {
      collectionId: req.params.id,
      error: error.message,
      userId: req.user.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to make collection private',
      error: error.message
    });
  }
};

/**
 * Generate ZIP archive for collection download
 */
const downloadCollectionZip = async (req, res) => {
  try {
    const { id } = req.params;

    // Get collection with access check
    const collection = await imageCollectionService.getCollectionAccess(id, req.user);

    // Get all images in collection
    const images = await Image.find({ collection: id });

    if (images.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No images found in collection'
      });
    }

    // Set response headers for ZIP download
    const zipFilename = `${collection.name.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.zip`;
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${zipFilename}"`);

    // Create ZIP archive
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });

    // Pipe archive to response
    archive.pipe(res);

    // Add each image to the archive
    for (const image of images) {
      try {
        if (fs.existsSync(image.internalPath)) {
          const filename = image.filename || `${image.title || 'image'}.${image.format}`;
          archive.file(image.internalPath, { name: filename });
        }
      } catch (error) {
        logger.warn('Failed to add image to ZIP', {
          imageId: image._id,
          path: image.internalPath,
          error: error.message
        });
      }
    }

    // Add collection info file
    const collectionInfo = {
      collectionName: collection.name,
      description: collection.description,
      imageCount: images.length,
      createdAt: collection.createdAt,
      exportedAt: new Date().toISOString()
    };
    archive.append(JSON.stringify(collectionInfo, null, 2), { name: 'collection_info.json' });

    // Finalize the archive
    await archive.finalize();

    logger.info('Collection ZIP downloaded', {
      collectionId: id,
      imageCount: images.length,
      userId: req.user.id
    });

  } catch (error) {
    logger.error('Failed to generate collection ZIP', {
      collectionId: req.params.id,
      error: error.message,
      userId: req.user.id
    });

    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Failed to generate ZIP archive',
        error: error.message
      });
    }
  }
};

module.exports = {
  startTunnel,
  stopTunnel,
  getTunnelStatus,
  makeCollectionPublic,
  makeCollectionPrivate,
  downloadCollectionZip
};
