// src/seeds/seedCore.js
const mongoose = require('mongoose');
const User = require('../models/user');
const { seedRolesAndPermissions } = require('./seedConfig');
const logger = require('../config/logger');

const seedCore = async (type = 'core') => {
  try {
    logger.info('Starting core seeding', { type });
    
    // Seed roles and permissions
    const { roleMap } = await seedRolesAndPermissions();
    
    // Create SuperAdmin
    logger.info('Seeding SuperAdmin user');
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
      logger.info('Creating SuperAdmin user', { loginId: superAdminLoginId });
      saUser = await User.create({
        username: superAdminLoginId,
        email: superAdminEmail,
        password: superAdminPassword,
        role: superAdminRoleId,
        isActive: true
      });
      logger.info('SuperAdmin user created', { userId: saUser._id, loginId: superAdminLoginId });
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
        logger.info('Updated existing SuperAdmin user', { username: saUser.username });
      } else {
        logger.info('SuperAdmin user already configured', { username: saUser.username });
      }
    }

    // Create additional data based on seed type
    let sampleUsers = [];
    let sampleImages = [];
    
    if (type === 'main' || type === 'development') {
      logger.info('Creating sample users');
      const User = require('../models/user');
      const Image = require('../models/image');
      
      const userData = [
        { 
          username: process.env.ADMIN_USERNAME || 'dev_admin', 
          email: process.env.ADMIN_EMAIL || 'dev.admin@test.com', 
          password: process.env.ADMIN_PASSWORD || 'dev123', 
          role: 'admin' 
        },
        { 
          username: process.env.EDITOR_USERNAME || 'test_editor', 
          email: process.env.EDITOR_EMAIL || 'editor@test.com', 
          password: process.env.EDITOR_PASSWORD || 'test123', 
          role: 'editor' 
        }
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
          logger.info('Sample user created', { username: data.username, email: data.email });
        }
        sampleUsers.push(user);
      }
    }
    
    logger.info('Core seeding completed', { 
      type, 
      superAdmin: { username: superAdminLoginId, email: superAdminEmail } 
    });
    
    return { superAdminUser: saUser, sampleUsers, sampleImages, roleMap };
    
  } catch (error) {
    logger.error('Core seeding error', { error: error.message, type, stack: error.stack });
    throw error;
  }
};

module.exports = seedCore;