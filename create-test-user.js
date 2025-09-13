// Quick script to create a test user
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/user');
const Role = require('./src/models/role');

async function createTestUser() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Find or create admin role
    let adminRole = await Role.findOne({ name: 'admin' });
    if (!adminRole) {
      adminRole = await Role.create({
        name: 'admin',
        description: 'Administrator role'
      });
      console.log('Created admin role');
    }

    // Check if test user exists
    const existingUser = await User.findOne({ username: 'admin' });
    if (existingUser) {
      console.log('Test user already exists: admin/admin123');
      process.exit(0);
    }

    // Create test user
    const testUser = await User.create({
      username: 'admin',
      email: 'admin@test.com',
      password: 'admin123',
      role: adminRole._id
    });

    console.log('✅ Test user created successfully!');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('Role: admin');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

createTestUser();