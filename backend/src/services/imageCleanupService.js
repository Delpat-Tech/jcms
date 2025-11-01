const Image = require('../models/image');
const { safeDeleteFile } = require('../utils/safeDeleteFile');
const logger = require('../config/logger');

const cleanupExpiredImages = async () => {
  try {
    const now = new Date();
    const expiredImages = await Image.find({
      expiresAt: { $lte: now },
      userPlan: 'free'
    });

    logger.info(`Found ${expiredImages.length} expired images to delete`);

    for (const image of expiredImages) {
      try {
        // Delete file from disk
        if (image.internalPath) {
          await safeDeleteFile(image.internalPath);
        }
        
        // Delete from database
        await Image.findByIdAndDelete(image._id);
        
        logger.info(`Deleted expired image: ${image._id}`);
      } catch (error) {
        logger.error(`Failed to delete image ${image._id}:`, error.message);
      }
    }

    return { deleted: expiredImages.length };
  } catch (error) {
    logger.error('Image cleanup error:', error);
    throw error;
  }
};

// Run cleanup every 24 hours
const startCleanupSchedule = () => {
  const INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
  
  setInterval(async () => {
    logger.info('Running scheduled image cleanup...');
    await cleanupExpiredImages();
  }, INTERVAL);
  
  // Run immediately on start
  setTimeout(async () => {
    logger.info('Running initial image cleanup...');
    await cleanupExpiredImages();
  }, 5000);
};

module.exports = { cleanupExpiredImages, startCleanupSchedule };
