// src/seeds/seedEmpty.js
const mongoose = require('mongoose');
const seedCore = require('./seedCore');
require('dotenv').config();

const runProductionSeeding = async () => {
  try {
    console.log("🌱 Starting Production Seeding (Minimal)...");
    
    // Only run core seeding (roles, permissions, SuperAdmin)
    const result = await seedCore();
    
    console.log("🎊 Production seeding completed successfully!");
    console.log("ℹ️ Only essential data has been seeded:");
    console.log("  - System tenant");
    console.log("  - Roles and permissions");
    console.log("  - SuperAdmin user");
    
    return result;
    
  } catch (error) {
    console.error('❌ Production seeding failed:', error.message);
    throw error;
  }
};

// Standalone execution function
const runStandalone = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    await runProductionSeeding();
    process.exit(0);
  } catch (error) {
    console.error('❌ Production seeding failed:', error.message);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  runStandalone();
}

module.exports = runProductionSeeding;