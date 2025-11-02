const cron = require('node-cron');
const fileCleanupService = require('../services/fileCleanupService');
const logger = require('../config/logger');

class FileCleanupJob {
  constructor() {
    this.isRunning = false;
  }

  /**
   * Start the cleanup job scheduler
   */
  start() {
    // Run cleanup daily at 2 AM
    cron.schedule('0 2 * * *', async () => {
      if (this.isRunning) {
        logger.warn('File cleanup job already running, skipping...');
        return;
      }

      this.isRunning = true;
      logger.info('Starting file cleanup job...');

      try {
        const results = await fileCleanupService.cleanupExpiredFiles();
        logger.info('File cleanup job completed successfully', results);
      } catch (error) {
        logger.error('File cleanup job failed', { error: error.message });
      } finally {
        this.isRunning = false;
      }
    });

    logger.info('File cleanup job scheduler started (runs daily at 2 AM)');
  }

  /**
   * Run cleanup manually
   */
  async runManual() {
    if (this.isRunning) {
      throw new Error('Cleanup job is already running');
    }

    this.isRunning = true;
    logger.info('Running manual file cleanup...');

    try {
      const results = await fileCleanupService.cleanupExpiredFiles();
      logger.info('Manual file cleanup completed', results);
      return results;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Get job status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      nextRun: '2:00 AM daily'
    };
  }
}

module.exports = new FileCleanupJob();