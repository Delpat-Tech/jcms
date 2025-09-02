// src/seeds/seedMain.js
const mongoose = require('mongoose');
const seedCore = require('./seedCore');
const User = require('../models/user');
require('dotenv').config();

const seedDummyData = async () => {
  try {
    console.log("🎭 Seeding Dummy Data...");
    
    // First run core seeding
    await seedCore();
    
    // Get system tenant for dummy users
    const systemTenant = await require('../models/tenant').findOne({ name: 'System' });
    
    // Create dummy users
    const dummyUsers = [
      {
        username: 'editor1',
        email: 'editor@example.com',
        password: 'editor123',
        role: 'editor',
        tenant: systemTenant._id,
        isVerified: true
      },
      {
        username: 'viewer1',
        email: 'viewer@example.com',
        password: 'viewer123',
        role: 'viewer',
        tenant: systemTenant._id,
        isVerified: true
      }
    ];

    for (const userData of dummyUsers) {
      let user = await User.findOne({ email: userData.email, tenant: systemTenant._id });
      if (!user) {
        user = await User.create(userData);
        console.log(`✅ Dummy user created: ${userData.email}`);
      } else {
        console.log(`ℹ️ Dummy user already exists: ${userData.email}`);
      }
    }

    console.log("🎉 Dummy data seeding completed!");
    
  } catch (error) {
    console.error('❌ Dummy data seeding error:', error.message);
    throw error;
  }
};

const runMainSeeding = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("🌱 Starting Main Seeding (Development)...");
    
    await seedDummyData();
    
    console.log("🎊 Main seeding process completed successfully!");
    
  } catch (error) {
    console.error('❌ Main seeding failed:', error.message);
    throw error;
  }
};

// Standalone execution function
const runStandalone = async () => {
  try {
    await runMainSeeding();
    process.exit(0);
  } catch (error) {
    console.error('❌ Main seeding failed:', error.message);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  runStandalone();
}

module.exports = seedDummyData;