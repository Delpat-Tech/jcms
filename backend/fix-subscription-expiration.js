// Fix expiration dates for subscribed tenants
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const connectDB = require('./src/config/db');
const File = require('./src/models/File');
const Image = require('./src/models/Image');
const Subscription = require('./src/models/Subscription');

async function fixSubscriptionExpiration() {
  try {
    await connectDB();
    console.log('Connected to database');

    // Get all active subscriptions
    const activeSubscriptions = await Subscription.find({
      isActive: true,
      isExpired: false,
      endDate: { $gt: new Date() }
    });

    console.log(`Found ${activeSubscriptions.length} active subscriptions`);

    let totalFilesFixed = 0;
    let totalImagesFixed = 0;

    for (const subscription of activeSubscriptions) {
      console.log(`Processing tenant: ${subscription.tenant}`);

      // Remove expiration dates from files for this tenant
      const fileResult = await File.updateMany(
        { 
          tenant: subscription.tenant,
          expiresAt: { $ne: null }
        },
        { 
          $unset: { expiresAt: 1 },
          $set: { isExpired: false }
        }
      );

      // Remove expiration dates from images for this tenant
      const imageResult = await Image.updateMany(
        { 
          tenant: subscription.tenant,
          expiresAt: { $ne: null }
        },
        { 
          $unset: { expiresAt: 1 },
          $set: { isExpired: false }
        }
      );

      console.log(`  - Fixed ${fileResult.modifiedCount} files`);
      console.log(`  - Fixed ${imageResult.modifiedCount} images`);

      totalFilesFixed += fileResult.modifiedCount;
      totalImagesFixed += imageResult.modifiedCount;
    }

    console.log(`\nTotal fixed: ${totalFilesFixed} files, ${totalImagesFixed} images`);
    console.log('Migration completed successfully');

  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    process.exit(0);
  }
}

if (require.main === module) {
  fixSubscriptionExpiration();
}

module.exports = { fixSubscriptionExpiration };