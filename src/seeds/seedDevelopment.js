// src/seeds/seedDevelopment.js
const mongoose = require('mongoose');
const seedMain = require('./seedMain');
const User = require('../models/user');
const Image = require('../models/image');
const Role = require('../models/role');

const seedDevelopment = async () => {
  try {
    console.log("🚀 Starting Development Seeding...");
    
    // First run main seeding
    const { superAdminUser, roleMap } = await seedMain();
    
    // Get roles for additional users
    const roles = await Role.find({}).select('name _id');
    const roleMapLocal = new Map(roles.map(role => [role.name, role._id]));
    
    console.log("👥 Seeding Additional Development Users...");
    
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
        username: 'content_writer',
        email: 'writer@test.com',
        password: 'test123',
        role: roleMapLocal.get('contributor')
      },
      {
        username: 'qa_tester',
        email: 'qa@test.com',
        password: 'test123',
        role: roleMapLocal.get('viewer')
      },
      {
        username: 'demo_user',
        email: 'demo@test.com',
        password: 'demo123',
        role: roleMapLocal.get('guest')
      }
    ];

    const createdDevUsers = [];
    for (const userData of devUsers) {
      let user = await User.findOne({ email: userData.email });
      if (!user) {
        user = await User.create(userData);
        console.log(`✅ Dev user created: ${userData.username}`);
      } else {
        console.log(`ℹ️ Dev user already exists: ${userData.username}`);
      }
      createdDevUsers.push(user);
    }

    console.log("🖼️ Seeding Development Images...");
    
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
        console.log(`✅ Dev image created: ${imageData.title}`);
      } else {
        console.log(`ℹ️ Dev image already exists: ${imageData.title}`);
      }
      createdDevImages.push(image);
    }

    console.log("🎉 Development seeding completed!");
    console.log(`👑 SuperAdmin: ${superAdminUser.username} (${superAdminUser.email})`);
    console.log(`👥 Development Users: ${createdDevUsers.length} created`);
    console.log(`🖼️ Development Images: ${createdDevImages.length} created`);
    console.log(`
🔑 Development Login Credentials:
- SuperAdmin: admin@system.com / admin123
- Dev Admin: dev.admin@test.com / dev123
- Editor 1: editor1@test.com / test123
- Editor 2: editor2@test.com / test123
- Writer: writer@test.com / test123
- QA Tester: qa@test.com / test123
- Demo User: demo@test.com / demo123`);
    
    return {
      superAdminUser,
      devUsers: createdDevUsers,
      devImages: createdDevImages,
      roleMap: roleMapLocal
    };
    
  } catch (error) {
    console.error('❌ Development seeding error:', error.message);
    throw error;
  }
};

module.exports = seedDevelopment;