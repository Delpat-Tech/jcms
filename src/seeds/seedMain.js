// src/seeds/seedMain.js
const mongoose = require('mongoose');
const seedCore = require('./seedCore');
const User = require('../models/user');
const Image = require('../models/image');

const seedMain = async () => {
  try {
    console.log("🌱 Starting Main Seeding...");
    
    // First run core seeding
    const { superAdminUser } = await seedCore();
    
    // Get roles for user creation
    const Role = require('../models/role');
    const roles = await Role.find({}).select('name _id');
    const roleMap = new Map(roles.map(role => [role.name, role._id]));
    
    console.log("👥 Seeding Sample Users...");
    
    // Create sample users
    const sampleUsers = [
      {
        username: 'john_admin',
        email: 'john@example.com',
        password: 'password123',
        role: roleMap.get('admin')
      },
      {
        username: 'jane_editor',
        email: 'jane@example.com',
        password: 'password123',
        role: roleMap.get('editor')
      },
      {
        username: 'mike_contributor',
        email: 'mike@example.com',
        password: 'password123',
        role: roleMap.get('contributor')
      },
      {
        username: 'bob_viewer',
        email: 'bob@example.com',
        password: 'password123',
        role: roleMap.get('viewer')
      },
      {
        username: 'guest_user',
        email: 'guest@example.com',
        password: 'password123',
        role: roleMap.get('guest')
      }
    ];

    const createdUsers = [];
    for (const userData of sampleUsers) {
      let user = await User.findOne({ email: userData.email });
      if (!user) {
        user = await User.create(userData);
        console.log(`✅ Sample user created: ${userData.username}`);
      } else {
        console.log(`ℹ️ Sample user already exists: ${userData.username}`);
      }
      createdUsers.push(user);
    }

    console.log("🖼️ Seeding Sample Images...");
    
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
        console.log(`✅ Sample image created: ${imageData.title}`);
      } else {
        console.log(`ℹ️ Sample image already exists: ${imageData.title}`);
      }
    }

    console.log("🎉 Main seeding completed!");
    console.log(`👑 SuperAdmin: ${superAdminUser.username} (${superAdminUser.email})`);
    console.log(`👥 Sample Users: ${createdUsers.length} created`);
    console.log(`🖼️ Sample Images: ${sampleImages.length} created`);
    console.log(`
🔑 Login Credentials:
- SuperAdmin: admin@system.com / admin123
- Admin: john@example.com / password123
- Editor: jane@example.com / password123
- Contributor: mike@example.com / password123
- Viewer: bob@example.com / password123
- Guest: guest@example.com / password123`);
    
    return {
      superAdminUser,
      sampleUsers: createdUsers,
      sampleImages,
      roleMap
    };
    
  } catch (error) {
    console.error('❌ Main seeding error:', error.message);
    throw error;
  }
};

module.exports = seedMain;