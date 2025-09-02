// src/routes/seedRoutes.js
const express = require('express');
const router = express.Router();
const { seedCore, seedMain, seedEmpty, seedRolesAndPermissions } = require('../seeds');

// Middleware to handle empty bodies for seed routes
router.use((req, res, next) => {
  if (req.method === 'POST' && (!req.body || Object.keys(req.body).length === 0)) {
    req.body = {};
  }
  next();
});

// Seed core data (roles, permissions, super admin)
router.post('/core', async (req, res) => {
  try {
    console.log('🌱 API: Starting core seeding...');
    const result = await seedCore();
    
    res.status(200).json({
      success: true,
      message: 'Core seeding completed successfully',
      data: {
        systemTenantId: result.systemTenant._id,
        superAdminId: result.superAdminUser._id
      }
    });
  } catch (error) {
    console.error('❌ API: Core seeding failed:', error.message);
    res.status(500).json({
      success: false,
      message: 'Core seeding failed',
      error: error.message
    });
  }
});

// Seed main data (includes core + dummy data)
router.post('/main', async (req, res) => {
  try {
    console.log('🎭 API: Starting main seeding...');
    await seedMain();
    
    res.status(200).json({
      success: true,
      message: 'Main seeding (with dummy data) completed successfully'
    });
  } catch (error) {
    console.error('❌ API: Main seeding failed:', error.message);
    res.status(500).json({
      success: false,
      message: 'Main seeding failed',
      error: error.message
    });
  }
});

// Seed empty (minimal setup)
router.post('/empty', async (req, res) => {
  try {
    console.log('🏗️ API: Starting empty seeding...');
    await seedEmpty();
    
    res.status(200).json({
      success: true,
      message: 'Empty seeding completed successfully'
    });
  } catch (error) {
    console.error('❌ API: Empty seeding failed:', error.message);
    res.status(500).json({
      success: false,
      message: 'Empty seeding failed',
      error: error.message
    });
  }
});

// Seed only roles and permissions
router.post('/roles-permissions', async (req, res) => {
  try {
    console.log('🔐 API: Starting roles and permissions seeding...');
    const result = await seedRolesAndPermissions();
    
    res.status(200).json({
      success: true,
      message: 'Roles and permissions seeding completed successfully',
      data: {
        systemTenantId: result.systemTenant._id,
        rolesCount: result.roleMap.size,
        permissionsCount: result.permissionMap.size
      }
    });
  } catch (error) {
    console.error('❌ API: Roles and permissions seeding failed:', error.message);
    res.status(500).json({
      success: false,
      message: 'Roles and permissions seeding failed',
      error: error.message
    });
  }
});

// Get seeding status/info
router.get('/status', async (req, res) => {
  try {
    const User = require('../models/user');
    const Role = require('../models/role');
    const Permission = require('../models/permission');
    const Tenant = require('../models/tenant');

    const stats = {
      users: await User.countDocuments(),
      roles: await Role.countDocuments(),
      permissions: await Permission.countDocuments(),
      tenants: await Tenant.countDocuments(),
      systemTenant: await Tenant.findOne({ name: 'System' }),
      superAdmin: await User.findOne({ role: 'admin' }).populate('tenant')
    };

    res.status(200).json({
      success: true,
      message: 'Database seeding status',
      data: stats
    });
  } catch (error) {
    console.error('❌ API: Status check failed:', error.message);
    res.status(500).json({
      success: false,
      message: 'Status check failed',
      error: error.message
    });
  }
});

module.exports = router;