// createSuperAdmin.js
const mongoose = require('mongoose');
const User = require('./src/models/user');
require('dotenv').config();

const createSuperAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Create super admin user
    const adminExists = await User.findOne({ 
      email: 'admin@system.com'
    });
    
    if (!adminExists) {
      await User.create({
        username: 'superadmin',
        email: 'admin@system.com',
        password: 'admin123',
        role: 'superadmin'
      });
      console.log('✅ Super admin created');
      console.log('📧 Email: admin@system.com');
      console.log('🔑 Password: admin123');
    } else {
      console.log('ℹ️ Super admin already exists');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

createSuperAdmin();