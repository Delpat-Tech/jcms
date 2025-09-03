// src/seeds/seedEmpty.js
const mongoose = require('mongoose');
const seedCore = require('./seedCore');
require('dotenv').config();

const seedEmpty = async () => {
  try {
    console.log("🌱 Starting Empty Seeding (Minimal)...");
    
    // Only run core seeding (roles, permissions, SuperAdmin)
    const result = await seedCore();
    
    console.log("🎉 Empty seeding completed successfully!");
    console.log("ℹ️ Only essential data has been seeded:");
    console.log("  - Roles and permissions");
    console.log("  - SuperAdmin user");
    
    return result;
    
  } catch (error) {
    console.error('❌ Empty seeding failed:', error.message);
    throw error;
  }
};

module.exports = seedEmpty;