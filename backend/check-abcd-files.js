// Check files for abcd tenant
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const connectDB = require('./src/config/db');
const File = require('./src/models/File');
const Image = require('./src/models/Image');
const Tenant = require('./src/models/Tenant');
const Subscription = require('./src/models/Subscription');

async function checkAbcdFiles() {
  try {
    await connectDB();
    console.log('Connected to database');

    // Find abcd tenant
    const abcdTenant = await Tenant.findOne({ name: 'abcd' });
    if (!abcdTenant) {
      console.log('abcd tenant not found');
      return;
    }

    console.log(`Found abcd tenant: ${abcdTenant._id}`);

    // Check subscription status
    const subscription = await Subscription.findOne({
      tenant: abcdTenant._id,
      isActive: true,
      isExpired: false,
      endDate: { $gt: new Date() }
    });

    console.log(`Has active subscription: ${subscription ? 'YES' : 'NO'}`);

    // Check files
    const files = await File.find({ tenant: abcdTenant._id });
    console.log(`\nFiles for abcd tenant: ${files.length}`);
    files.forEach(file => {
      console.log(`  - ${file.title} | expiresAt: ${file.expiresAt} | isExpired: ${file.isExpired}`);
    });

    // Check images
    const images = await Image.find({ tenant: abcdTenant._id });
    console.log(`\nImages for abcd tenant: ${images.length}`);
    images.forEach(image => {
      console.log(`  - ${image.title} | expiresAt: ${image.expiresAt} | isExpired: ${image.isExpired}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

if (require.main === module) {
  checkAbcdFiles();
}

module.exports = { checkAbcdFiles };