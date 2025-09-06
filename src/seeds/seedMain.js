// src/seeds/seedMain.js
const mongoose = require('mongoose');
const seedCore = require('./seedCore');
const User = require('../models/user');
const Image = require('../models/image');
const logger = require('../config/logger');

const seedMain = async () => {
  try {
    logger.info('Starting main seeding');
    
    // First run core seeding
    const { superAdminUser } = await seedCore();
    
    logger.info('Seeding sample users');
    
    // Create sample users
    const sampleUsers = [
      {
        username: 'john_admin',
        email: 'john@example.com',
        password: 'password123',
        role: 'admin'
      },
      {
        username: 'jane_editor',
        email: 'jane@example.com',
        password: 'password123',
        role: 'editor'
      },
      {
        username: 'bob_viewer',
        email: 'bob@example.com',
        password: 'password123',
        role: 'viewer'
      }
    ];

    const createdUsers = [];
    for (const userData of sampleUsers) {
      let user = await User.findOne({ email: userData.email });
      if (!user) {
        user = await User.create(userData);
        logger.info('Sample user created', { username: userData.username, email: userData.email });
      } else {
        logger.info('Sample user already exists', { username: userData.username });
      }
      createdUsers.push(user);
    }

    logger.info('Seeding sample images');
    
    // Create sample images for each user
    const sampleImages = [
      {
        title: 'Sample Image 1',
        description: 'This is a sample image for testing',
        filename: 'sample1.jpg',
        originalName: 'sample1.jpg',
        mimetype: 'image/jpeg',
        size: 1024000,
        path: '/uploads/sample1.jpg',
        user: createdUsers[0]._id
      },
      {
        title: 'Sample Image 2',
        description: 'Another sample image',
        filename: 'sample2.png',
        originalName: 'sample2.png',
        mimetype: 'image/png',
        size: 2048000,
        path: '/uploads/sample2.png',
        user: createdUsers[1]._id
      }
    ];

    for (const imageData of sampleImages) {
      let image = await Image.findOne({ filename: imageData.filename });
      if (!image) {
        image = await Image.create(imageData);
        logger.info('Sample image created', { title: imageData.title, filename: imageData.filename });
      } else {
        logger.info('Sample image already exists', { title: imageData.title });
      }
    }

    logger.info('Main seeding completed', { 
      superAdmin: { username: superAdminUser.username, email: superAdminUser.email },
      usersCreated: createdUsers.length,
      imagesCreated: sampleImages.length
    });
    
    return {
      superAdminUser,
      sampleUsers: createdUsers,
      sampleImages
    };
    
  } catch (error) {
    logger.error('Main seeding error', { error: error.message, stack: error.stack });
    throw error;
  }
};

module.exports = seedMain;