const File = require('../models/file');
const Image = require('../models/image');
const logger = require('../config/logger');

class SubscriptionService {
  /**
   * Remove expiration dates from all files/images when tenant gets subscription
   */
  async activateSubscriptionBenefits(tenantId) {
    try {
      logger.info('Activating subscription benefits for tenant', { tenantId });

      // Remove expiration dates from files
      const fileResult = await File.updateMany(
        { 
          tenant: tenantId,
          expiresAt: { $ne: null }
        },
        { 
          $unset: { expiresAt: 1 },
          $set: { isExpired: false }
        }
      );

      // Remove expiration dates from images
      const imageResult = await Image.updateMany(
        { 
          tenant: tenantId,
          expiresAt: { $ne: null }
        },
        { 
          $unset: { expiresAt: 1 },
          $set: { isExpired: false }
        }
      );

      logger.info('Subscription benefits activated', {
        tenantId,
        filesUpdated: fileResult.modifiedCount,
        imagesUpdated: imageResult.modifiedCount
      });

      return {
        filesUpdated: fileResult.modifiedCount,
        imagesUpdated: imageResult.modifiedCount
      };
    } catch (error) {
      logger.error('Error activating subscription benefits', {
        tenantId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Set expiration dates for all files/images when subscription expires
   */
  async deactivateSubscriptionBenefits(tenantId, expirationDays = 15) {
    try {
      logger.info('Deactivating subscription benefits for tenant', { tenantId });

      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + expirationDays);

      // Set expiration dates for files
      const fileResult = await File.updateMany(
        { 
          tenant: tenantId,
          expiresAt: null
        },
        { 
          $set: { 
            expiresAt: expirationDate,
            isExpired: false
          }
        }
      );

      // Set expiration dates for images
      const imageResult = await Image.updateMany(
        { 
          tenant: tenantId,
          expiresAt: null
        },
        { 
          $set: { 
            expiresAt: expirationDate,
            isExpired: false
          }
        }
      );

      logger.info('Subscription benefits deactivated', {
        tenantId,
        filesUpdated: fileResult.modifiedCount,
        imagesUpdated: imageResult.modifiedCount,
        expirationDate
      });

      return {
        filesUpdated: fileResult.modifiedCount,
        imagesUpdated: imageResult.modifiedCount,
        expirationDate
      };
    } catch (error) {
      logger.error('Error deactivating subscription benefits', {
        tenantId,
        error: error.message
      });
      throw error;
    }
  }
}

module.exports = new SubscriptionService();