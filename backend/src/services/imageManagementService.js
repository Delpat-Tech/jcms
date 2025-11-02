// services/imageManagementService.js
const Image = require('../models/image');
const cloudflareR2Service = require('./cloudflareR2Service');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const logger = require('../config/logger');

class ImageManagementService {
  /**
   * Process and store image with metadata extraction
   * @param {Object} fileData - File upload data
   * @param {Object} user - User object
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} Processed image data
   */
  async processAndStoreImage(fileData, user, options = {}) {
    try {
      const {
        title,
        project,
        tags = [],
        notes = {},
        format = 'webp',
        quality = 80
      } = options;

      // Extract image metadata using Sharp
      const imageBuffer = fs.readFileSync(fileData.path);
      const imageInfo = await sharp(imageBuffer).metadata();
      
      // Calculate aspect ratio
      const aspectRatio = imageInfo.width && imageInfo.height 
        ? `${imageInfo.width}:${imageInfo.height}` 
        : null;

      // Process image with Sharp
      const processedBuffer = await this.processImageBuffer(imageBuffer, format, quality);
      
      // Calculate compression ratio
      const compressionRatio = imageBuffer.length > 0 
        ? (processedBuffer.length / imageBuffer.length) 
        : 1;

      // Generate storage paths
      const tenantPath = user.tenant ? user.tenant._id.toString() : 'system';
      const uploadDir = path.join(__dirname, '..', '..', 'uploads', tenantPath, user.id.toString());
      fs.mkdirSync(uploadDir, { recursive: true });

      const timestamp = Date.now();
      const sanitizedFilename = this.sanitizeFilename(fileData.originalname);
      const baseName = path.parse(sanitizedFilename).name;
      const outputFilename = `${baseName}-${timestamp}.${format}`;
      const outputPath = path.join(uploadDir, outputFilename);

      // Save processed image locally
      await sharp(processedBuffer).toFile(outputPath);

      // Get file size
      const fileStats = fs.statSync(outputPath);
      const processedFileSize = fileStats.size;

      // Generate URLs
      const relativePath = path.relative(path.join(__dirname, '..', '..'), outputPath).replace(/\\/g, '/');
      const fileUrl = `/${relativePath}`;
      const publicUrl = fileUrl; // Local public URL

      // Create image record
      const imageData = {
        title: title || sanitizedFilename,
        filename: fileData.originalname,
        user: user.id,
        tenant: user.tenant ? user.tenant._id : null,
        tenantName: user.tenant ? user.tenant.name : 'System',
        project: project || null,
        internalPath: outputPath.replace(/\\/g, '/'),
        fileUrl,
        publicUrl,
        format,
        fileSize: processedFileSize,
        visibility: 'private', // Default to private
        uploadDate: new Date(),
        metadata: {
          width: imageInfo.width,
          height: imageInfo.height,
          aspectRatio,
          colorSpace: imageInfo.space,
          hasAlpha: imageInfo.hasAlpha,
          originalSize: imageBuffer.length,
          compressionRatio
        },
        tags: Array.isArray(tags) ? tags : [],
        notes,
        accessCount: 0,
        versions: [{
          format,
          size: processedFileSize,
          path: outputPath.replace(/\\/g, '/'),
          createdAt: new Date()
        }]
      };

      // Set expiration for free tenants
      if (options.subscriptionLimits && options.subscriptionLimits.fileExpirationDays) {
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + options.subscriptionLimits.fileExpirationDays);
        imageData.expiresAt = expirationDate;
      }

      const newImage = await Image.create(imageData);

      // Clean up temp file
      if (fs.existsSync(fileData.path)) {
        fs.unlinkSync(fileData.path);
      }

      logger.info('Image processed and stored successfully', {
        imageId: newImage._id,
        originalSize: imageBuffer.length,
        processedSize: processedFileSize,
        compressionRatio: compressionRatio.toFixed(2)
      });

      return {
        success: true,
        image: newImage,
        metadata: {
          originalSize: imageBuffer.length,
          processedSize: processedFileSize,
          compressionRatio: compressionRatio.toFixed(2),
          dimensions: `${imageInfo.width}x${imageInfo.height}`
        }
      };
    } catch (error) {
      logger.error('Failed to process and store image', {
        error: error.message,
        filename: fileData.originalname
      });
      
      // Clean up temp file on error
      if (fileData.path && fs.existsSync(fileData.path)) {
        fs.unlinkSync(fileData.path);
      }
      
      throw error;
    }
  }

  /**
   * Make images public by uploading to Cloudflare R2
   * @param {Array} imageIds - Array of image IDs to make public
   * @param {Object} user - User object
   * @returns {Promise<Object>} Results of the operation
   */
  async makeImagesPublic(imageIds, user) {
    if (!cloudflareR2Service.isConfigured()) {
      throw new Error('Cloudflare R2 is not configured. Cannot make images public.');
    }

    const results = {
      success: [],
      failed: [],
      publicUrls: []
    };

    for (const imageId of imageIds) {
      try {
        const image = await Image.findById(imageId);
        if (!image) {
          results.failed.push({ imageId, error: 'Image not found' });
          continue;
        }

        // Check permissions
        if (!this.canUserAccessImage(image, user)) {
          results.failed.push({ imageId, error: 'Access denied' });
          continue;
        }

        // Skip if already public
        if (image.visibility === 'public' && image.cloudflareUrl) {
          results.success.push({
            imageId,
            publicUrl: image.cloudflareUrl,
            status: 'already_public'
          });
          results.publicUrls.push({
            imageId,
            title: image.title,
            publicUrl: image.cloudflareUrl
          });
          continue;
        }

        // Generate R2 key
        const r2Key = cloudflareR2Service.generateKey(
          user.id,
          user.tenant ? user.tenant._id : 'system',
          image.filename,
          image.format
        );

        // Upload to Cloudflare R2
        const uploadResult = await cloudflareR2Service.uploadFile(
          image.internalPath,
          r2Key,
          {
            originalName: image.filename,
            userId: user.id,
            tenant: user.tenant ? user.tenant._id : 'system',
            imageId: image._id.toString(),
            title: image.title
          }
        );

        // Update image record
        await Image.findByIdAndUpdate(imageId, {
          visibility: 'public',
          cloudflareUrl: uploadResult.publicUrl,
          cloudflareKey: r2Key,
          publicationDate: new Date()
        });

        results.success.push({
          imageId,
          publicUrl: uploadResult.publicUrl,
          status: 'newly_public'
        });

        results.publicUrls.push({
          imageId,
          title: image.title,
          publicUrl: uploadResult.publicUrl
        });

        logger.info('Image made public successfully', {
          imageId,
          r2Key,
          publicUrl: uploadResult.publicUrl
        });

      } catch (error) {
        logger.error('Failed to make image public', {
          imageId,
          error: error.message
        });
        
        results.failed.push({
          imageId,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Make images private by removing from Cloudflare R2
   * @param {Array} imageIds - Array of image IDs to make private
   * @param {Object} user - User object
   * @returns {Promise<Object>} Results of the operation
   */
  async makeImagesPrivate(imageIds, user) {
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
        if (!this.canUserAccessImage(image, user)) {
          results.failed.push({ imageId, error: 'Access denied' });
          continue;
        }

        // Skip if already private
        if (image.visibility === 'private') {
          results.success.push({
            imageId,
            status: 'already_private'
          });
          continue;
        }

        // Delete from Cloudflare R2 if exists
        if (image.cloudflareKey && cloudflareR2Service.isConfigured()) {
          await cloudflareR2Service.deleteFile(image.cloudflareKey);
        }

        // Update image record
        await Image.findByIdAndUpdate(imageId, {
          visibility: 'private',
          cloudflareUrl: null,
          cloudflareKey: null,
          publicationDate: null
        });

        results.success.push({
          imageId,
          status: 'newly_private'
        });

        logger.info('Image made private successfully', { imageId });

      } catch (error) {
        logger.error('Failed to make image private', {
          imageId,
          error: error.message
        });
        
        results.failed.push({
          imageId,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Get images for content page with filtering and pagination
   * @param {Object} user - User object
   * @param {Object} filters - Filter options
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Object>} Filtered images with metadata
   */
  async getImagesForContentPage(user, filters = {}, pagination = {}) {
    try {
      const {
        project,
        visibility,
        tags,
        search,
        dateFrom,
        dateTo
      } = filters;

      const {
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = pagination;

      // Build query
      let query = {};

      // Apply user/tenant filtering
      if (user.role.name === 'superadmin') {
        // Superadmin can see all images
      } else {
        query.tenant = user.tenant ? user.tenant._id : null;
        
        if (user.role.name !== 'admin') {
          // Non-admin users can only see their own images
          query.user = user.id;
        }
      }

      // Apply filters
      if (project) query.project = project;
      if (visibility) query.visibility = visibility;
      if (tags && tags.length > 0) query.tags = { $in: tags };
      
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { filename: { $regex: search, $options: 'i' } },
          { tags: { $regex: search, $options: 'i' } }
        ];
      }

      if (dateFrom || dateTo) {
        query.createdAt = {};
        if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
        if (dateTo) query.createdAt.$lte = new Date(dateTo);
      }

      // Execute query with pagination
      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

      const [images, total] = await Promise.all([
        Image.find(query)
          .populate('user', 'username email')
          .populate('project', 'title')
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
        Image.countDocuments(query)
      ]);

      // Add computed fields
      const enhancedImages = images.map(image => ({
        ...image,
        accessUrl: image.visibility === 'public' && image.cloudflareUrl 
          ? image.cloudflareUrl 
          : image.fileUrl,
        formattedSize: this.formatFileSize(image.fileSize),
        isPublic: image.visibility === 'public',
        canMakePublic: cloudflareR2Service.isConfigured(),
        daysSinceUpload: Math.floor((Date.now() - new Date(image.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      }));

      return {
        images: enhancedImages,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        },
        summary: {
          total,
          private: images.filter(img => img.visibility === 'private').length,
          public: images.filter(img => img.visibility === 'public').length,
          totalSize: images.reduce((sum, img) => sum + (img.fileSize || 0), 0)
        }
      };
    } catch (error) {
      logger.error('Failed to get images for content page', {
        error: error.message,
        userId: user.id
      });
      throw error;
    }
  }

  /**
   * Process image buffer with Sharp
   * @param {Buffer} buffer - Image buffer
   * @param {string} format - Target format
   * @param {number} quality - Quality setting
   * @returns {Promise<Buffer>} Processed image buffer
   */
  async processImageBuffer(buffer, format, quality = 80) {
    const sharpInstance = sharp(buffer);
    
    switch (format.toLowerCase()) {
      case 'webp':
        return await sharpInstance.webp({ quality }).toBuffer();
      case 'avif':
        return await sharpInstance.avif({ quality: Math.floor(quality * 0.6) }).toBuffer();
      case 'jpeg':
      case 'jpg':
        return await sharpInstance.jpeg({ quality }).toBuffer();
      case 'png':
        return await sharpInstance.png({ compressionLevel: Math.floor((100 - quality) / 10) }).toBuffer();
      case 'gif':
        return await sharpInstance.gif().toBuffer();
      case 'tiff':
        return await sharpInstance.tiff({ quality }).toBuffer();
      case 'bmp':
        return await sharpInstance.toFormat('bmp').toBuffer();
      default:
        return buffer;
    }
  }

  /**
   * Check if user can access image
   * @param {Object} image - Image document
   * @param {Object} user - User object
   * @returns {boolean} Access permission
   */
  canUserAccessImage(image, user) {
    // Superadmin can access all images
    if (user.role.name === 'superadmin') {
      return true;
    }

    // Check tenant access
    const userTenant = user.tenant ? user.tenant._id.toString() : null;
    const imageTenant = image.tenant ? image.tenant.toString() : null;
    
    if (userTenant !== imageTenant) {
      return false;
    }

    // Admin can access all images in their tenant
    if (user.role.name === 'admin') {
      return true;
    }

    // Other users can only access their own images
    return image.user.toString() === user.id;
  }

  /**
   * Sanitize filename for safe storage
   * @param {string} filename - Original filename
   * @returns {string} Sanitized filename
   */
  sanitizeFilename(filename) {
    return filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  }

  /**
   * Format file size for display
   * @param {number} bytes - File size in bytes
   * @returns {string} Formatted file size
   */
  formatFileSize(bytes) {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }

  /**
   * Track image access
   * @param {string} imageId - Image ID
   * @returns {Promise<void>}
   */
  async trackImageAccess(imageId) {
    try {
      await Image.findByIdAndUpdate(imageId, {
        $inc: { accessCount: 1 },
        lastAccessed: new Date()
      });
    } catch (error) {
      logger.error('Failed to track image access', {
        imageId,
        error: error.message
      });
    }
  }
}

module.exports = new ImageManagementService();
