const cron = require('node-cron');
const Subscription = require('../models/Subscription');
const subscriptionService = require('../services/subscriptionService');
const logger = require('../config/logger');

class SubscriptionExpirationJob {
  constructor() {
    this.isRunning = false;
  }

  /**
   * Start the subscription expiration job scheduler
   */
  start() {
    // Run every hour to check for expired subscriptions
    cron.schedule('0 * * * *', async () => {
      if (this.isRunning) {
        logger.warn('Subscription expiration job already running, skipping...');
        return;
      }

      this.isRunning = true;
      logger.info('Starting subscription expiration job...');

      try {
        const results = await this.processExpiredSubscriptions();
        logger.info('Subscription expiration job completed successfully', results);
      } catch (error) {
        logger.error('Subscription expiration job failed', { error: error.message });
      } finally {
        this.isRunning = false;
      }
    });

    logger.info('Subscription expiration job scheduler started (runs hourly)');
  }

  /**
   * Process expired subscriptions
   */
  async processExpiredSubscriptions() {
    try {
      const now = new Date();
      
      // Find subscriptions that just expired (still active but past end date)
      const expiredSubscriptions = await Subscription.find({
        isActive: true,
        isExpired: false,
        endDate: { $lt: now }
      });

      let processedCount = 0;

      for (const subscription of expiredSubscriptions) {
        try {
          // Mark subscription as expired
          await Subscription.findByIdAndUpdate(subscription._id, {
            isExpired: true,
            isActive: false
          });

          // Set expiration dates on tenant's files
          await subscriptionService.deactivateSubscriptionBenefits(subscription.tenant);
          
          processedCount++;
          
          logger.info('Processed expired subscription', {
            subscriptionId: subscription._id,
            tenantId: subscription.tenant,
            endDate: subscription.endDate
          });
        } catch (error) {
          logger.error('Failed to process expired subscription', {
            subscriptionId: subscription._id,
            error: error.message
          });
        }
      }

      return {
        processedCount,
        totalFound: expiredSubscriptions.length
      };
    } catch (error) {
      logger.error('Error processing expired subscriptions', { error: error.message });
      throw error;
    }
  }

  /**
   * Run manual check
   */
  async runManual() {
    if (this.isRunning) {
      throw new Error('Subscription expiration job is already running');
    }

    this.isRunning = true;
    logger.info('Running manual subscription expiration check...');

    try {
      const results = await this.processExpiredSubscriptions();
      logger.info('Manual subscription expiration check completed', results);
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
      nextRun: 'Every hour'
    };
  }
}

module.exports = new SubscriptionExpirationJob();