const Image = require('../models/image');
const File = require('../models/file');
const cloudflareR2Service = require('./cloudflareR2Service');
const fs = require('fs');
const logger = require('../config/logger');

class FileCleanupService {
  /**
   * Clean up expired files for free tenants
   */
  async cleanupExpiredFiles() {
    try {
      const now = new Date();
      
      // Find expired files
      const [expiredImages, expiredFiles] = await Promise.all([
        Image.find({
          expiresAt: { $lte: now },
          isExpired: false
        }),
        File.find({
          expiresAt: { $lte: now },
          isExpired: false
        })
      ]);

      const results = {
        images: { deleted: 0, failed: 0 },
        files: { deleted: 0, failed: 0 }
      };

      // Clean up expired images
      for (const image of expiredImages) {
        try {
          await this.deleteExpiredImage(image);
          results.images.deleted++;
        } catch (error) {
          logger.error('Failed to delete expired image', {
            imageId: image._id,
            error: error.message
          });
          results.images.failed++;
        }
      }

      // Clean up expired files
      for (const file of expiredFiles) {
        try {
          await this.deleteExpiredFile(file);
          results.files.deleted++;
        } catch (error) {
          logger.error('Failed to delete expired file', {
            fileId: file._id,
            error: error.message
          });
          results.files.failed++;
        }
      }

      logger.info('File cleanup completed', results);
      return results;
    } catch (error) {
      logger.error('File cleanup service error', { error: error.message });
      throw error;
    }
  }

  /**
   * Delete an expired image
   */
  async deleteExpiredImage(image) {
    // Delete from Cloudflare R2 if exists
    if (image.cloudflareKey && cloudflareR2Service.isConfigured()) {
      try {
        await cloudflareR2Service.deleteFile(image.cloudflareKey);
      } catch (error) {
        logger.warn('Failed to delete image from R2', {
          imageId: image._id,
          cloudflareKey: image.cloudflareKey,
          error: error.message
        });
      }
    }

    // Delete local file
    if (image.internalPath && fs.existsSync(image.internalPath)) {
      try {
        fs.unlinkSync(image.internalPath);
      } catch (error) {
        logger.warn('Failed to delete local image file', {
          imageId: image._id,
          path: image.internalPath,
          error: error.message
        });
      }
    }

    // Mark as expired and delete from database
    await Image.findByIdAndDelete(image._id);
    
    logger.info('Expired image deleted', {
      imageId: image._id,
      filename: image.filename,
      expiresAt: image.expiresAt
    });
  }

  /**
   * Delete an expired file
   */
  async deleteExpiredFile(file) {
    // Delete local file
    if (file.internalPath && fs.existsSync(file.internalPath)) {
      try {
        fs.unlinkSync(file.internalPath);
      } catch (error) {
        logger.warn('Failed to delete local file', {
          fileId: file._id,
          path: file.internalPath,
          error: error.message
        });
      }
    }

    // Delete from database
    await File.findByIdAndDelete(file._id);
    
    logger.info('Expired file deleted', {
      fileId: file._id,
      filename: file.originalName,
      expiresAt: file.expiresAt
    });
  }

  /**
   * Get files that will expire soon (for notifications)
   */
  async getFilesExpiringSoon(days = 3) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    
    const [images, files] = await Promise.all([
      Image.find({
        expiresAt: { $lte: futureDate, $gt: new Date() },
        isExpired: false
      }).populate('user', 'username email').populate('tenant', 'name'),
      File.find({
        expiresAt: { $lte: futureDate, $gt: new Date() },
        isExpired: false
      }).populate('user', 'username email').populate('tenant', 'name')
    ]);

    return { images, files };
  }
}

module.exports = new FileCleanupService();