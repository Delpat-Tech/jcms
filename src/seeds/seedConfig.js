// src/seeds/seedConfig.js
const mongoose = require('mongoose');
const Role = require('../models/role');
const Permission = require('../models/permission');
const logger = require('../config/logger');

const seedConfig = {
  // Default credentials for different environments
  credentials: {
    superadmin: {
      username: 'superadmin',
      email: 'admin@system.com',
      password: 'admin123'
    },
    development: {
      adminPassword: 'dev123',
      userPassword: 'test123',
      demoPassword: 'demo123'
    },
    production: {
      // Production should use environment variables
      adminPassword: process.env.ADMIN_PASSWORD || 'changeMe123!',
      userPassword: process.env.USER_PASSWORD || 'changeMe123!'
    }
  },

  // Permission categories for better organization
  permissionCategories: {
    user: ['create', 'read', 'update', 'delete', 'activate', 'profile'],
    role: ['create', 'read', 'update', 'delete', 'assign'],
    permission: ['read', 'assign'],
    content: ['create', 'read', 'update', 'delete', 'publish', 'moderate'],
    image: ['create', 'read', 'update', 'delete', 'bulk'],
    analytics: ['view'],
    reports: ['generate', 'export'],
    system: ['settings', 'logs', 'backup', 'maintenance'],
    tenant: ['create', 'read', 'update', 'delete', 'manage'],
    api: ['read', 'write', 'admin']
  },

  // Role definitions with permission mappings
  roleDefinitions: {
    superadmin: {
      description: 'Super Administrator - Full system access',
      permissions: 'ALL'
    },
    admin: {
      description: 'Administrator - Tenant level management',
      permissions: [
        'user.*', 'role.read', 'role.assign', 'permission.read',
        'content.*', 'image.*', 'analytics.*', 'reports.*',
        'system.settings', 'system.logs', 'api.read', 'api.write'
      ]
    },
    editor: {
      description: 'Content Editor - Create and manage content',
      permissions: [
        'content.create', 'content.read', 'content.update', 'content.publish',
        'image.create', 'image.read', 'image.update', 'image.delete',
        'user.profile', 'user.read', 'analytics.view',
        'api.read', 'api.write'
      ]
    },
    viewer: {
      description: 'Content Viewer - View only access',
      permissions: [
        'content.read',
        'image.read',
        'user.profile',
        'user.read',
        'analytics.view',
        'api.read'
      ]
    }
  },

  // Sample data templates
  sampleData: {
    users: {
      admin: { username: 'john_admin', email: 'john@example.com' },
      editor: { username: 'jane_editor', email: 'jane@example.com' },
      contributor: { username: 'mike_contributor', email: 'mike@example.com' },

      guest: { username: 'guest_user', email: 'guest@example.com' }
    },
    devUsers: [
      { username: 'dev_admin', email: 'dev.admin@test.com', role: 'admin' },
      { username: 'test_editor1', email: 'editor1@test.com', role: 'editor' },
      { username: 'test_editor2', email: 'editor2@test.com', role: 'editor' },
      { username: 'content_writer', email: 'writer@test.com', role: 'contributor' },

      { username: 'demo_user', email: 'demo@test.com', role: 'guest' }
    ]
  },

  // Seed options
  options: {
    dropExisting: false, // Whether to drop existing data before seeding
    skipIfExists: true,  // Skip creation if data already exists
    verbose: true,       // Detailed logging
    createIndexes: true  // Create database indexes
  },

  // Permissions definition
  permissions: [
    // User Management
    { name: 'user.create', description: 'Create users' },
    { name: 'user.read', description: 'View users' },
    { name: 'user.update', description: 'Update users' },
    { name: 'user.delete', description: 'Delete users' },
    { name: 'user.activate', description: 'Activate/deactivate users' },
    { name: 'user.profile', description: 'Manage own profile' },
    
    // Role Management
    { name: 'role.create', description: 'Create roles' },
    { name: 'role.read', description: 'View roles' },
    { name: 'role.update', description: 'Update roles' },
    { name: 'role.delete', description: 'Delete roles' },
    { name: 'role.assign', description: 'Assign roles to users' },
    
    // Permission Management
    { name: 'permission.read', description: 'View permissions' },
    { name: 'permission.assign', description: 'Assign permissions' },
    
    // Content Management
    { name: 'content.create', description: 'Create content' },
    { name: 'content.read', description: 'View content' },
    { name: 'content.update', description: 'Update content' },
    { name: 'content.delete', description: 'Delete content' },
    { name: 'content.publish', description: 'Publish content' },
    { name: 'content.moderate', description: 'Moderate content' },
    
    // Image Management
    { name: 'image.create', description: 'Upload images' },
    { name: 'image.read', description: 'View images' },
    { name: 'image.update', description: 'Update image metadata' },
    { name: 'image.delete', description: 'Delete images' },
    { name: 'image.bulk', description: 'Bulk image operations' },
    
    // Analytics & Reports
    { name: 'analytics.view', description: 'View analytics' },
    { name: 'reports.generate', description: 'Generate reports' },
    { name: 'reports.export', description: 'Export reports' },
    
    // System Management
    { name: 'system.settings', description: 'Manage system settings' },
    { name: 'system.logs', description: 'View system logs' },
    { name: 'system.backup', description: 'Manage backups' },
    { name: 'system.maintenance', description: 'System maintenance' },
    
    // Tenant Management
    { name: 'tenant.create', description: 'Create tenants' },
    { name: 'tenant.read', description: 'View tenants' },
    { name: 'tenant.update', description: 'Update tenants' },
    { name: 'tenant.delete', description: 'Delete tenants' },
    { name: 'tenant.manage', description: 'Full tenant management' },
    
    // API Access
    { name: 'api.read', description: 'Read API access' },
    { name: 'api.write', description: 'Write API access' },
    { name: 'api.admin', description: 'Admin API access' }
  ]
};

// Seeding function for roles and permissions
const seedRolesAndPermissions = async () => {
  try {
    logger.info('Starting roles and permissions seeding');

    // Create permissions
    const permissionMap = new Map();
    for (const permData of seedConfig.permissions) {
      let permission = await Permission.findOne({ name: permData.name });
      if (!permission) {
        permission = await Permission.create(permData);
        logger.info('Permission created', { name: permData.name });
      }
      permissionMap.set(permData.name, permission._id);
    }

    // Define roles with their permissions
    const roles = [
      {
        name: 'superadmin',
        description: 'Super Administrator - Full system access',
        permissions: Array.from(permissionMap.values()) // All permissions
      },
      {
        name: 'admin',
        description: 'Administrator - Tenant level management',
        permissions: [
          // User Management
          permissionMap.get('user.create'),
          permissionMap.get('user.read'),
          permissionMap.get('user.update'),
          permissionMap.get('user.activate'),
          permissionMap.get('user.profile'),
          // Role Management
          permissionMap.get('role.read'),
          permissionMap.get('role.assign'),
          permissionMap.get('permission.read'),
          // Content Management
          permissionMap.get('content.create'),
          permissionMap.get('content.read'),
          permissionMap.get('content.update'),
          permissionMap.get('content.delete'),
          permissionMap.get('content.publish'),
          permissionMap.get('content.moderate'),
          // Image Management
          permissionMap.get('image.create'),
          permissionMap.get('image.read'),
          permissionMap.get('image.update'),
          permissionMap.get('image.delete'),
          permissionMap.get('image.bulk'),
          // Analytics
          permissionMap.get('analytics.view'),
          permissionMap.get('reports.generate'),
          permissionMap.get('reports.export'),
          // System
          permissionMap.get('system.settings'),
          permissionMap.get('system.logs'),
          // API
          permissionMap.get('api.read'),
          permissionMap.get('api.write')
        ]
      },
      {
        name: 'editor',
        description: 'Content Editor - Create and manage content',
        permissions: [
          // Content Management
          permissionMap.get('content.create'),
          permissionMap.get('content.read'),
          permissionMap.get('content.update'),
          permissionMap.get('content.publish'),
          // Image Management
          permissionMap.get('image.create'),
          permissionMap.get('image.read'),
          permissionMap.get('image.update'),
          permissionMap.get('image.delete'),
          // User Profile
          permissionMap.get('user.profile'),
          permissionMap.get('user.read'),
          // Basic Analytics
          permissionMap.get('analytics.view'),
          // API
          permissionMap.get('api.read'),
          permissionMap.get('api.write')
        ]
      },
      {
        name: 'viewer',
        description: 'Content Viewer - View only access',
        permissions: [
          // Content
          permissionMap.get('content.read'),
          // Image
          permissionMap.get('image.read'),
          // User Profile
          permissionMap.get('user.profile'),
          permissionMap.get('user.read'),
          // Basic Analytics
          permissionMap.get('analytics.view'),
          // API
          permissionMap.get('api.read')
        ]
      }
    ];

    // Create roles
    const roleMap = new Map();
    for (const roleData of roles) {
      let role = await Role.findOne({ name: roleData.name });
      if (!role) {
        role = await Role.create(roleData);
        logger.info('Role created', { name: roleData.name });
      } else {
        // Update permissions if role exists
        role.permissions = roleData.permissions;
        await role.save();
        logger.info('Role updated', { name: roleData.name });
      }
      roleMap.set(roleData.name, role._id);
    }

    logger.info('Roles and permissions seeding completed');
    return { roleMap, permissionMap };
    
  } catch (error) {
    logger.error('Roles and Permissions seeding error', { error: error.message, stack: error.stack });
    throw error;
  }
};

module.exports = {
  ...seedConfig,
  seedRolesAndPermissions
};