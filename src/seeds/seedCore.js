// src/seeds/seedCore.js
const mongoose = require('mongoose');
const User = require('../models/user');
const { seedRolesAndPermissions } = require('./seedConfig');

const seedCore = async (type = 'core') => {
  try {
    console.log(`🌱 Starting ${type.charAt(0).toUpperCase() + type.slice(1)} Seeding...`);
    
    // Seed roles and permissions
    const { roleMap } = await seedRolesAndPermissions();
    
    // Create SuperAdmin
    console.log("👑 Seeding SuperAdmin User...");
    const superAdminLoginId = process.env.SUPER_ADMIN_LOGIN_ID || 'superadmin';
    const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'admin123';
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@system.com';
    const superAdminRoleId = roleMap.get('superadmin');

    if (!superAdminRoleId) throw new Error('SuperAdmin role failed to seed!');
    if (!superAdminLoginId || !superAdminPassword) {
      console.warn('SUPER_ADMIN_LOGIN_ID or SUPER_ADMIN_PASSWORD not set in .env. Using defaults.');
    }

    let saUser = await User.findOne({ username: superAdminLoginId });
    if (!saUser) {
      saUser = await User.findOne({ email: superAdminEmail });
    }

    if (!saUser) {
      console.log(`Creating SuperAdmin user (Login ID: ${superAdminLoginId})...`);
      saUser = await User.create({
        username: superAdminLoginId,
        email: superAdminEmail,
        password: superAdminPassword,
        role: superAdminRoleId,
        isActive: true
      });
      console.log(`✅ SuperAdmin user created with ID: ${saUser._id}`);
    } else {
      let updated = false;
      if (!saUser.role || !saUser.role.equals(superAdminRoleId)) {
        saUser.role = superAdminRoleId;
        updated = true;
      }
      if (saUser.username !== superAdminLoginId) {
        saUser.username = superAdminLoginId;
        updated = true;
      }
      if (saUser.email !== superAdminEmail) {
        saUser.email = superAdminEmail;
        updated = true;
      }
      if (superAdminPassword) {
        saUser.password = superAdminPassword;
        updated = true;
      }

      if (updated) {
        await saUser.save();
        console.log(`✅ Updated existing SuperAdmin user (${saUser.username})`);
      } else {
        console.log(`ℹ️ SuperAdmin user (${saUser.username}) already exists and is configured.`);
      }
    }

    // Create additional data based on seed type
    let sampleUsers = [];
    let sampleImages = [];
    
    if (type === 'main' || type === 'development') {
      console.log("👥 Creating sample users...");
      const User = require('../models/user');
      const Image = require('../models/image');
      
      const userData = type === 'development' ? [
        { username: 'dev_admin', email: 'dev.admin@test.com', password: 'dev123', role: 'admin' },
        { username: 'test_editor', email: 'editor@test.com', password: 'test123', role: 'editor' },
        { username: 'qa_tester', email: 'qa@test.com', password: 'test123', role: 'viewer' }
      ] : [
        { username: 'john_admin', email: 'john@example.com', password: 'password123', role: 'admin' },
        { username: 'jane_editor', email: 'jane@example.com', password: 'password123', role: 'editor' }
      ];
      
      for (const data of userData) {
        let user = await User.findOne({ email: data.email });
        if (!user) {
          user = await User.create({
            username: data.username,
            email: data.email,
            password: data.password,
            role: roleMap.get(data.role),
            isActive: true
          });
          console.log(`✅ Sample user created: ${data.username}`);
        }
        sampleUsers.push(user);
      }
    }
    
    console.log(`🎉 ${type.charAt(0).toUpperCase() + type.slice(1)} seeding completed!`);
    console.log(`👤 Username: ${superAdminLoginId}`);
    console.log(`📧 Email: ${superAdminEmail}`);
    console.log(`🔑 Password: ${superAdminPassword}`);
    
    return { superAdminUser: saUser, sampleUsers, sampleImages, roleMap };
    
  } catch (error) {
    console.error('❌ Core seeding error:', error.message);
    throw error;
  }
};

module.exports = seedCore;