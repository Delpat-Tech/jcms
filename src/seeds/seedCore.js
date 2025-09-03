// src/seeds/seedCore.js
const mongoose = require('mongoose');
const User = require('../models/user');
const seedRolesAndPermissions = require('./seedRolesAndPermissions');

const seedCore = async () => {
  try {
    console.log("🌱 Starting Core Seeding...");
    
    // Seed roles and permissions
    const { roleMap } = await seedRolesAndPermissions();
    
    // Create SuperAdmin
    console.log("👑 Seeding SuperAdmin User...");
    const superAdminEmail = 'admin@system.com';
    const superAdminPassword = 'admin123';
    const superAdminUsername = 'superadmin';

    let saUser = await User.findOne({ email: superAdminEmail });

    if (!saUser) {
      console.log(`Creating SuperAdmin user...`);
      const superAdminRole = roleMap.get('superadmin');
      if (!superAdminRole) {
        throw new Error('SuperAdmin role not found in roleMap');
      }
      
      saUser = await User.create({
        username: superAdminUsername,
        email: superAdminEmail,
        password: superAdminPassword,
        role: superAdminRole,
        isActive: true
      });
      console.log(`✅ SuperAdmin user created with ID: ${saUser._id}`);
    } else {
      console.log(`ℹ️ SuperAdmin user already exists`);
    }

    console.log("🎉 Core seeding completed!");
    console.log(`👤 Username: ${superAdminUsername}`);
    console.log(`📧 Email: ${superAdminEmail}`);
    console.log(`🔑 Password: ${superAdminPassword}`);
    
    return { superAdminUser: saUser };
    
  } catch (error) {
    console.error('❌ Core seeding error:', error.message);
    throw error;
  }
};

module.exports = seedCore;