// services/imageCollectionService.js
const mongoose = require('mongoose');
const ImageCollection = require('../models/imageCollection');
const Image = require('../models/image');
const cloudflareR2Service = require('./cloudflareR2Service');
const logger = require('../config/logger');

class ImageCollectionService {
  /**
   * Create a new image collection
   */
  async createCollection(data, user) {
    try {
      const { name, description, tags = [], project } = data;
      
      // Generate slug from name
      const slug = this.generateSlug(name);
      
      const collection = await ImageCollection.create({
        name,
        description,
        slug,
        user: user.id,
        tenant: user.tenant ? user.tenant._id : null,
        tenantName: user.tenant ? user.tenant.name : 'System',
        project,
        tags,
        stats: {
          totalImages: 0,
          totalSize: 0,
          publicImages: 0,
          privateImages: 0
        }
      });

      logger.info('Image collection created', {
        collectionId: collection._id,
        name: collection.name,
        userId: user.id
      });

      return collection;
    } catch (error) {
      logger.error('Failed to create image collection', {
        error: error.message,
        userId: user.id
      });
      throw error;
    }
  }

  /**
   * Get collections for user with stats
   */
  async getCollections(user, filters = {}) {
    try {
      const {
        search,
        visibility,
        tags,
        project,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = filters;

      // Build query
      let query = {};

      // Apply user/tenant filtering
      const userRole = user.role && user.role.name ? user.role.name : 'editor';
      
      if (userRole === 'superadmin') {
        // Superadmin can see all collections
      } else {
        query.tenant = user.tenant ? user.tenant._id : null;
        
        if (userRole !== 'admin') {
          // Non-admin users can only see their own collections
          query.user = user.id;
        }
      }

      // Apply filters
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { tags: { $regex: search, $options: 'i' } }
        ];
      }

      if (visibility) query.visibility = visibility;
      if (project) query.project = project;
      if (tags && tags.length > 0) query.tags = { $in: tags };

      // Execute query
      const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
      
      const collections = await ImageCollection.find(query)
        .populate('user', 'username email')
        .populate('project', 'title')
        .populate('coverImage', 'fileUrl title')
        .sort(sort)
        .lean();

      // If no collections, return empty array
      if (collections.length === 0) {
        return [];
      }

      // Get image counts and stats for each collection
      const collectionsWithStats = await Promise.all(
        collections.map(async (collection) => {
          try {
            const imageStats = await Image.aggregate([
              { $match: { collection: collection._id } },
              {
                $group: {
                  _id: null,
                  totalImages: { $sum: 1 },
                  totalSize: { $sum: '$fileSize' },
                  publicImages: {
                    $sum: { $cond: [{ $eq: ['$visibility', 'public'] }, 1, 0] }
                  },
                  privateImages: {
                    $sum: { $cond: [{ $eq: ['$visibility', 'private'] }, 1, 0] }
                  }
                }
              }
            ]);

            const stats = imageStats[0] || {
              totalImages: 0,
              totalSize: 0,
              publicImages: 0,
              privateImages: 0
            };

            // Get recent images for preview
            const recentImages = await Image.find({ collection: collection._id })
              .select('fileUrl title format')
              .sort({ createdAt: -1 })
              .limit(4)
              .lean();

            return {
              ...collection,
              stats,
              recentImages: recentImages || [],
              formattedSize: this.formatFileSize(stats.totalSize),
              canMakePublic: cloudflareR2Service.isConfigured()
            };
          } catch (error) {
            logger.error('Error processing collection stats', {
              collectionId: collection._id,
              error: error.message
            });
            
            // Return collection with default stats if there's an error
            return {
              ...collection,
              stats: {
                totalImages: 0,
                totalSize: 0,
                publicImages: 0,
                privateImages: 0
              },
              recentImages: [],
              formattedSize: '0 B',
              canMakePublic: cloudflareR2Service.isConfigured()
            };
          }
        })
      );

      return collectionsWithStats;
    } catch (error) {
      logger.error('Failed to get collections', {
        error: error.message,
        userId: user.id
      });
      throw error;
    }
  }

  /**
   * Get collection by ID with images
   */
  async getCollectionById(collectionId, user, imageFilters = {}) {
    try {
      // Check access permissions
      let collectionQuery = { _id: collectionId };
      
      const userRole = user.role && user.role.name ? user.role.name : 'editor';
      
      if (userRole !== 'superadmin') {
        collectionQuery.tenant = user.tenant ? user.tenant._id : null;
        
        if (userRole !== 'admin') {
          collectionQuery.user = user.id;
        }
      }

      const collection = await ImageCollection.findOne(collectionQuery)
        .populate('user', 'username email')
        .populate('project', 'title')
        .lean();

      if (!collection) {
        throw new Error('Collection not found or access denied');
      }

      // Get images in this collection
      const {
        search,
        visibility,
        tags,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        page = 1,
        limit = 20
      } = imageFilters;

      let imageQuery = { collection: collectionId };

      if (search) {
        imageQuery.$or = [
          { title: { $regex: search, $options: 'i' } },
          { filename: { $regex: search, $options: 'i' } },
          { tags: { $regex: search, $options: 'i' } }
        ];
      }

      if (visibility) imageQuery.visibility = visibility;
      if (tags && tags.length > 0) imageQuery.tags = { $in: tags };

      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

      const [images, totalImages] = await Promise.all([
        Image.find(imageQuery)
          .populate('user', 'username email')
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
        Image.countDocuments(imageQuery)
      ]);

      // Add computed fields to images
      const enhancedImages = images.map(image => ({
        ...image,
        accessUrl: image.visibility === 'public' && image.cloudflareUrl 
          ? image.cloudflareUrl 
          : image.fileUrl,
        formattedSize: this.formatFileSize(image.fileSize),
        isPublic: image.visibility === 'public',
        daysSinceUpload: Math.floor((Date.now() - new Date(image.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      }));

      return {
        collection,
        images: enhancedImages,
        pagination: {
          page,
          limit,
          total: totalImages,
          pages: Math.ceil(totalImages / limit)
        }
      };
    } catch (error) {
      logger.error('Failed to get collection by ID', {
        collectionId,
        error: error.message,
        userId: user.id
      });
      throw error;
    }
  }

  /**
   * Make entire collection public
   */
  async makeCollectionPublic(collectionId, user) {
    try {
      if (!cloudflareR2Service.isConfigured()) {
        throw new Error('Cloudflare R2 is not configured');
      }

      // Get collection and verify access
      const collection = await this.getCollectionAccess(collectionId, user);
      
      // Get all images in collection
      const images = await Image.find({ 
        collection: collectionId,
        visibility: 'private' // Only process private images
      });

      if (images.length === 0) {
        return {
          success: true,
          message: 'Collection is already public or has no images',
          publicUrls: []
        };
      }

      // Generate collection folder path in R2
      const collectionFolder = `collections/${collection.slug}`;
      
      const results = {
        success: [],
        failed: [],
        publicUrls: []
      };

      // Upload each image to R2
      for (const image of images) {
        try {
          const r2Key = `${collectionFolder}/${image.filename}`;
          
          const uploadResult = await cloudflareR2Service.uploadFile(
            image.internalPath,
            r2Key,
            {
              originalName: image.filename,
              userId: user.id,
              tenant: user.tenant ? user.tenant._id : 'system',
              imageId: image._id.toString(),
              collectionId: collectionId,
              collectionName: collection.name
            }
          );

          // Update image record
          await Image.findByIdAndUpdate(image._id, {
            visibility: 'public',
            cloudflareUrl: uploadResult.publicUrl,
            cloudflareKey: r2Key,
            publicationDate: new Date()
          });

          results.success.push({
            imageId: image._id,
            title: image.title,
            publicUrl: uploadResult.publicUrl
          });

          results.publicUrls.push({
            imageId: image._id,
            title: image.title,
            publicUrl: uploadResult.publicUrl
          });

        } catch (error) {
          logger.error('Failed to make image public in collection', {
            imageId: image._id,
            collectionId,
            error: error.message
          });
          
          results.failed.push({
            imageId: image._id,
            title: image.title,
            error: error.message
          });
        }
      }

      // Update collection status if all images succeeded
      if (results.failed.length === 0) {
        await ImageCollection.findByIdAndUpdate(collectionId, {
          visibility: 'public',
          publicationDate: new Date(),
          cloudflareFolder: collectionFolder
        });
      }

      // Update collection stats
      await this.updateCollectionStats(collectionId);

      logger.info('Collection made public', {
        collectionId,
        successful: results.success.length,
        failed: results.failed.length
      });

      return {
        success: results.failed.length === 0,
        message: `${results.success.length} image(s) made public${results.failed.length > 0 ? `, ${results.failed.length} failed` : ''}`,
        results,
        collectionUrl: collection.visibility === 'public' ? collection.publicUrl : null
      };

    } catch (error) {
      logger.error('Failed to make collection public', {
        collectionId,
        error: error.message,
        userId: user.id
      });
      throw error;
    }
  }

  /**
   * Make collection private
   */
  async makeCollectionPrivate(collectionId, user) {
    try {
      const collection = await this.getCollectionAccess(collectionId, user);
      
      // Get all public images in collection
      const images = await Image.find({ 
        collection: collectionId,
        visibility: 'public'
      });

      const results = {
        success: [],
        failed: []
      };

      // Remove each image from R2 and make private
      for (const image of images) {
        try {
          // Delete from R2 if exists
          if (image.cloudflareKey && cloudflareR2Service.isConfigured()) {
            await cloudflareR2Service.deleteFile(image.cloudflareKey);
          }

          // Update image record
          await Image.findByIdAndUpdate(image._id, {
            visibility: 'private',
            cloudflareUrl: null,
            cloudflareKey: null,
            publicationDate: null
          });

          results.success.push({
            imageId: image._id,
            title: image.title
          });

        } catch (error) {
          logger.error('Failed to make image private in collection', {
            imageId: image._id,
            collectionId,
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
      await ImageCollection.findByIdAndUpdate(collectionId, {
        visibility: 'private',
        publicationDate: null,
        cloudflareFolder: null
      });

      // Update collection stats
      await this.updateCollectionStats(collectionId);

      return {
        success: results.failed.length === 0,
        message: `${results.success.length} image(s) made private${results.failed.length > 0 ? `, ${results.failed.length} failed` : ''}`,
        results
      };

    } catch (error) {
      logger.error('Failed to make collection private', {
        collectionId,
        error: error.message,
        userId: user.id
      });
      throw error;
    }
  }

  /**
   * Add images to collection
   */
  async addImagesToCollection(collectionId, imageIds, user) {
    try {
      const collection = await this.getCollectionAccess(collectionId, user);
      
      // Update images to belong to this collection
      const result = await Image.updateMany(
        { 
          _id: { $in: imageIds },
          user: (user.role && user.role.name === 'admin') ? { $exists: true } : user.id, // Admin can move any image in tenant
          tenant: user.tenant ? user.tenant._id : null
        },
        { 
          collection: collectionId 
        }
      );

      // Update collection stats
      await this.updateCollectionStats(collectionId);

      logger.info('Images added to collection', {
        collectionId,
        imageCount: result.modifiedCount,
        userId: user.id
      });

      return {
        success: true,
        message: `${result.modifiedCount} image(s) added to collection`,
        modifiedCount: result.modifiedCount
      };

    } catch (error) {
      logger.error('Failed to add images to collection', {
        collectionId,
        error: error.message,
        userId: user.id
      });
      throw error;
    }
  }

  /**
   * Update collection statistics
   */
  async updateCollectionStats(collectionId) {
    try {
      const stats = await Image.aggregate([
        { $match: { collection: new mongoose.Types.ObjectId(collectionId) } },
        {
          $group: {
            _id: null,
            totalImages: { $sum: 1 },
            totalSize: { $sum: '$fileSize' },
            publicImages: {
              $sum: { $cond: [{ $eq: ['$visibility', 'public'] }, 1, 0] }
            },
            privateImages: {
              $sum: { $cond: [{ $eq: ['$visibility', 'private'] }, 1, 0] }
            }
          }
        }
      ]);

      const collectionStats = stats[0] || {
        totalImages: 0,
        totalSize: 0,
        publicImages: 0,
        privateImages: 0
      };

      await ImageCollection.findByIdAndUpdate(collectionId, {
        stats: collectionStats
      });

      return collectionStats;
    } catch (error) {
      logger.error('Failed to update collection stats', {
        collectionId,
        error: error.message
      });
    }
  }

  /**
   * Helper: Get collection with access check
   */
  async getCollectionAccess(collectionId, user) {
    let query = { _id: collectionId };
    
    const userRole = user.role && user.role.name ? user.role.name : 'editor';
    
    if (userRole !== 'superadmin') {
      query.tenant = user.tenant ? user.tenant._id : null;
      
      if (userRole !== 'admin') {
        query.user = user.id;
      }
    }

    const collection = await ImageCollection.findOne(query);
    
    if (!collection) {
      throw new Error('Collection not found or access denied');
    }

    return collection;
  }

  /**
   * Helper: Generate slug from name
   */
  generateSlug(name) {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '') + '-' + Date.now().toString(36).slice(-4);
  }

  /**
   * Helper: Format file size
   */
  formatFileSize(bytes) {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }
}

module.exports = new ImageCollectionService();
