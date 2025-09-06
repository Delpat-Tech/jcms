// createSuperAdmin.js
const mongoose = require('mongoose');
const User = require('./src/models/user');
const Role = require('./src/models/role');
const logger = require('./src/config/logger');
require('dotenv').config();

const createSuperAdmin = async () => {
  try {
    logger.info('Connecting to MongoDB');
    await mongoose.connect(process.env.MONGO_URI);
    logger.info('Connected to MongoDB successfully');
    
    // Check if superadmin role exists
    let superadminRole = await Role.findOne({ name: 'superadmin' });
    
    if (!superadminRole) {
      logger.info('Creating superadmin role');
      superadminRole = await Role.create({
        name: 'superadmin',
        description: 'Super Administrator - Full system access',
        permissions: [] // Will be populated by seeding
      });
      logger.info('Superadmin role created successfully');
    }
    
    // Check if super admin user exists
    const adminExists = await User.findOne({ 
      email: 'admin@system.com'
    });
    
    if (!adminExists) {
      logger.info('Creating superadmin user');
      const superAdmin = await User.create({
        username: 'superadmin',
        email: 'admin@system.com',
        password: 'admin123',
        role: superadminRole._id,
        isActive: true
      });
      
      logger.info('Super admin created successfully', { 
        email: 'admin@system.com', 
        userId: superAdmin._id, 
        roleId: superadminRole._id 
      });
    } else {
      logger.info('Super admin already exists', { email: 'admin@system.com' });
      
      // Update role if needed
      if (adminExists.role.toString() !== superadminRole._id.toString()) {
        await User.findByIdAndUpdate(adminExists._id, { role: superadminRole._id });
        logger.info('Updated superadmin role reference');
      }
    }
    
    logger.info('SuperAdmin setup completed', { nextSteps: ['Run seeding: npm run seed', 'Start server: npm run dev'] });
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    logger.error('Error creating superadmin', { error: error.message, code: error.code, stack: error.stack });
    if (error.code === 11000) {
      logger.error('Duplicate key error - user may already exist', { error: error.message });
    }
    await mongoose.disconnect();
    process.exit(1);
  }
};

createSuperAdmin();