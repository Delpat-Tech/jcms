// checkSuperAdmin.js - Utility to check and fix superadmin configuration
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/user');
const Role = require('./src/models/role');
const logger = require('./src/config/logger');

const checkSuperAdminConfiguration = async () => {
  try {
    console.log('🔍 Checking SuperAdmin Configuration...\n');
    
    // Connect to database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI);
      console.log('✅ Connected to MongoDB');
    }

    // Get superadmin role
    const superAdminRole = await Role.findOne({ name: 'superadmin' });
    if (!superAdminRole) {
      console.log('❌ SuperAdmin role not found! Run seeding first.');
      return;
    }

    // Find all superadmins
    const superAdmins = await User.find({ role: superAdminRole._id });
    console.log(`📊 Found ${superAdmins.length} superadmin(s):`);
    
    superAdmins.forEach((admin, index) => {
      console.log(`   ${index + 1}. Username: ${admin.username}, Email: ${admin.email}, Active: ${admin.isActive}`);
    });

    // Check .env configuration
    const envUsername = process.env.SUPER_ADMIN_USERNAME || process.env.SUPER_ADMIN_LOGIN_ID || 'superadmin';
    const envEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@system.com';
    const envPassword = process.env.SUPER_ADMIN_PASSWORD || 'admin123';

    console.log(`\n🔧 .env Configuration:`);
    console.log(`   Username: ${envUsername}`);
    console.log(`   Email: ${envEmail}`);
    console.log(`   Password: ${envPassword ? '[SET]' : '[NOT SET]'}`);

    // Analysis and recommendations
    console.log(`\n📋 Analysis:`);
    
    if (superAdmins.length === 0) {
      console.log('❌ No superadmin found! This is critical.');
      console.log('💡 Recommendation: Run "npm run seed" to create the superadmin.');
    } else if (superAdmins.length === 1) {
      const admin = superAdmins[0];
      console.log('✅ Exactly one superadmin found (correct).');
      
      if (admin.username === envUsername && admin.email === envEmail) {
        console.log('✅ SuperAdmin credentials match .env configuration.');
      } else {
        console.log('⚠️  SuperAdmin credentials do not match .env configuration.');
        console.log('💡 Recommendation: Run "npm run seed" to update credentials.');
      }
      
      if (!admin.isActive) {
        console.log('❌ SuperAdmin is deactivated!');
        console.log('💡 Recommendation: Reactivate the superadmin account.');
      }
    } else {
      console.log('❌ Multiple superadmins found! This violates the single superadmin rule.');
      console.log('💡 Recommendation: Run "npm run seed" to clean up duplicates.');
    }

    console.log('\n🔒 Security Status:');
    console.log(`   Single SuperAdmin Rule: ${superAdmins.length === 1 ? '✅ ENFORCED' : '❌ VIOLATED'}`);
    console.log(`   .env Credentials Match: ${superAdmins.length === 1 && superAdmins[0].username === envUsername ? '✅ YES' : '❌ NO'}`);
    console.log(`   SuperAdmin Active: ${superAdmins.length === 1 && superAdmins[0].isActive ? '✅ YES' : '❌ NO'}`);

  } catch (error) {
    console.error('❌ Error checking superadmin configuration:', error.message);
    logger.error('SuperAdmin check error', { error: error.message, stack: error.stack });
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('\n🔌 Disconnected from MongoDB');
    }
  }
};

// Run if called directly
if (require.main === module) {
  checkSuperAdminConfiguration()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Script failed:', error.message);
      process.exit(1);
    });
}

module.exports = { checkSuperAdminConfiguration };