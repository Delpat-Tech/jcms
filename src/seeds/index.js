// src/seeds/index.js
const mongoose = require('mongoose');
const seedCore = require('./seedCore');
const seedMain = require('./seedMain');
const seedEmpty = require('./seedEmpty');
const { seedRolesAndPermissions } = require('./seedConfig');
const seedDevelopment = require('./seedDevelopment');
require('dotenv').config();

// Main seed runner with database connection
const runSeeds = async (type = 'core') => {
  try {
    // Validate environment variables
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI environment variable is required');
    }
    
    // Connect to database if not already connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI);
      console.log('💾 Connected to MongoDB for seeding');
    }

    switch (type) {
      case 'core':
      case 'empty':
        await seedCore('core');
        break;
      case 'main':
        await seedCore('main');
        break;
      case 'dev':
      case 'development':
        await seedCore('development');
        break;
      case 'roles':
        await seedRolesAndPermissions();
        break;
      default:
        console.log('⚠️ Unknown seed type. Available: core, main, dev, empty, roles');
    }

    console.log('✅ Seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    throw error;
  }
};

// Standalone execution
const runStandalone = async () => {
  const seedType = process.argv[2] || 'core';
  try {
    await runSeeds(seedType);
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  runStandalone();
}

module.exports = {
  seedCore,
  seedMain,
  seedEmpty,
  seedRolesAndPermissions,
  seedDevelopment,
  runSeeds
};