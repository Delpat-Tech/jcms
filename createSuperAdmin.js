// createSuperAdmin.js
const mongoose = require('mongoose');
const User = require('./src/models/user');
const Tenant = require('./src/models/tenant');
require('dotenv').config();

const createSuperAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Create system tenant
    let systemTenant = await Tenant.findOne({ subdomain: 'system' });
    if (!systemTenant) {
      systemTenant = await Tenant.create({
        name: 'System Admin',
        subdomain: 'system'
      });
      console.log('✅ System tenant created');
    }

    // Create super admin user
    const adminExists = await User.findOne({ 
      email: 'admin@system.com', 
      tenant: systemTenant._id 
    });
    
    if (!adminExists) {
      await User.create({
        username: 'superadmin',
        email: 'admin@system.com',
        password: 'admin123',
        role: 'admin',
        tenant: systemTenant._id
      });
      console.log('✅ Super admin created');
      console.log('📧 Email: admin@system.com');
      console.log('🔑 Password: admin123');
      console.log('🏢 Tenant ID:', systemTenant._id);
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