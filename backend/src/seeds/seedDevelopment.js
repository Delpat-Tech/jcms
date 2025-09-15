// src/seeds/seedDevelopment.js
const mongoose = require('mongoose');
const seedMain = require('./seedMain');
const User = require('../models/user');
const Image = require('../models/image');
const Role = require('../models/role');
const logger = require('../config/logger');

const seedDevelopment = async () => {
  try {
    logger.info('Starting development seeding');
    
    // First run main seeding
    const { superAdminUser, roleMap } = await seedMain();
    
    // Get roles for additional users
    const roles = await Role.find({}).select('name _id');
    const roleMapLocal = new Map(roles.map(role => [role.name, role._id]));
    
    logger.info('Seeding additional development users');
    
    // Create additional development users
    const devUsers = [
      {
        username: 'dev_admin',
        email: 'dev.admin@test.com',
        password: 'dev123',
        role: roleMapLocal.get('admin')
      },
      {
        username: 'test_editor1',
        email: 'editor1@test.com',
        password: 'test123',
        role: roleMapLocal.get('editor')
      },
      {
        username: 'test_editor2',
        email: 'editor2@test.com',
        password: 'test123',
        role: roleMapLocal.get('editor')
      },
      {
        username: 'qa_tester',
        email: 'qa@test.com',
        password: 'test123',
        role: roleMapLocal.get('viewer')
      }
    ];

    const createdDevUsers = [];
    for (const userData of devUsers) {
      let user = await User.findOne({ email: userData.email });
      if (!user) {
        user = await User.create(userData);
        logger.info('Dev user created', { username: userData.username, email: userData.email });
      } else {
        logger.info('Dev user already exists', { username: userData.username });
      }
      createdDevUsers.push(user);
    }

    logger.info('Seeding development images');
    
    // Create development images
    const devImages = [
      {
        title: 'Hero Banner Image',
        description: 'Main hero banner for homepage',
        filename: 'hero-banner.jpg',
        originalName: 'hero-banner.jpg',
        mimetype: 'image/jpeg',
        size: 2048000,
        path: '/uploads/dev/hero-banner.jpg',
        user: createdDevUsers[0]._id,
        tags: ['banner', 'hero', 'homepage']
      },
      {
        title: 'Product Showcase',
        description: 'Product showcase image',
        filename: 'product-showcase.png',
        originalName: 'product-showcase.png',
        mimetype: 'image/png',
        size: 1536000,
        path: '/uploads/dev/product-showcase.png',
        user: createdDevUsers[1]._id,
        tags: ['product', 'showcase']
      },
      {
        title: 'Team Photo',
        description: 'Company team photo',
        filename: 'team-photo.jpg',
        originalName: 'team-photo.jpg',
        mimetype: 'image/jpeg',
        size: 3072000,
        path: '/uploads/dev/team-photo.jpg',
        user: createdDevUsers[2]._id,
        tags: ['team', 'company', 'about']
      },
      {
        title: 'Blog Post Image 1',
        description: 'Featured image for blog post',
        filename: 'blog-featured-1.webp',
        originalName: 'blog-featured-1.webp',
        mimetype: 'image/webp',
        size: 512000,
        path: '/uploads/dev/blog-featured-1.webp',
        user: createdDevUsers[3]._id,
        tags: ['blog', 'featured', 'content']
      },
      {
        title: 'Gallery Image 1',
        description: 'Gallery showcase image',
        filename: 'gallery-1.jpg',
        originalName: 'gallery-1.jpg',
        mimetype: 'image/jpeg',
        size: 1024000,
        path: '/uploads/dev/gallery-1.jpg',
        user: createdDevUsers[1]._id,
        tags: ['gallery', 'showcase']
      }
    ];

    const createdDevImages = [];
    for (const imageData of devImages) {
      let image = await Image.findOne({ filename: imageData.filename });
      if (!image) {
        image = await Image.create(imageData);
        logger.info('Dev image created', { title: imageData.title, filename: imageData.filename });
      } else {
        logger.info('Dev image already exists', { title: imageData.title });
      }
      createdDevImages.push(image);
    }

    logger.info('Development seeding completed', {
      superAdmin: { username: superAdminUser.username, email: superAdminUser.email },
      devUsersCreated: createdDevUsers.length,
      devImagesCreated: createdDevImages.length,
      credentials: [
        'SuperAdmin: admin@system.com / admin123',
        'Dev Admin: dev.admin@test.com / dev123',
        'Editor 1: editor1@test.com / test123',
        'Editor 2: editor2@test.com / test123',
        'QA Tester: qa@test.com / test123'
      ]
    });
    console.log(`
🔑 Development Login Credentials:
- SuperAdmin: admin@system.com / admin123
- Dev Admin: dev.admin@test.com / dev123
- Editor 1: editor1@test.com / test123
- Editor 2: editor2@test.com / test123
- QA Tester: qa@test.com / test123`);
    
    return {
      superAdminUser,
      devUsers: createdDevUsers,
      devImages: createdDevImages,
      roleMap: roleMapLocal
    };
    
  } catch (error) {
    logger.error('Development seeding error', { error: error.message, stack: error.stack });
    throw error;
  }
};

module.exports = seedDevelopment;