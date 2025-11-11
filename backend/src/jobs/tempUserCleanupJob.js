const cron = require('node-cron');
const User = require('../models/user');
const logger = require('../config/logger');

class TempUserCleanupJob {
  constructor() {
    this.isRunning = false;
  }

  start() {
    // Run every 30 minutes
    cron.schedule('*/30 * * * *', async () => {
      if (this.isRunning) return;
      
      this.isRunning = true;
      try {
        const Tenant = require('../models/tenant');
        const Subscription = require('../models/subscription');
        
        // Find expired temporary users
        const expiredUsers = await User.find({
          isTemporary: true,
          expiresAt: { $lt: new Date() }
        });
        
        // Delete associated tenants and subscriptions
        for (const user of expiredUsers) {
          if (user.tenant) {
            await Subscription.deleteMany({ tenant: user.tenant });
            await Tenant.findByIdAndDelete(user.tenant);
          }
        }
        
        // Delete expired users
        const result = await User.deleteMany({
          isTemporary: true,
          expiresAt: { $lt: new Date() }
        });
        
        if (result.deletedCount > 0) {
          logger.info(`Deleted ${result.deletedCount} expired temporary users and their data`);
        }
      } catch (error) {
        logger.error('Temp user cleanup failed', { error: error.message });
      } finally {
        this.isRunning = false;
      }
    });

    logger.info('Temporary user cleanup job started (runs every 30 minutes)');
  }
}

module.exports = new TempUserCleanupJob();
