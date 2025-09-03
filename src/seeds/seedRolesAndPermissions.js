// src/seeds/seedRolesAndPermissions.js
const mongoose = require('mongoose');
const Role = require('../models/role');
const Permission = require('../models/permission');

const seedRolesAndPermissions = async () => {
  try {
    console.log("🔐 Seeding Roles and Permissions...");

    // Define permissions
    const permissions = [
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
    ];

    // Create permissions
    const permissionMap = new Map();
    for (const permData of permissions) {
      let permission = await Permission.findOne({ name: permData.name });
      if (!permission) {
        permission = await Permission.create(permData);
        console.log(`✅ Permission created: ${permData.name}`);
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
        name: 'contributor',
        description: 'Content Contributor - Create content for review',
        permissions: [
          permissionMap.get('content.create'),
          permissionMap.get('content.read'),
          permissionMap.get('content.update'),
          permissionMap.get('image.create'),
          permissionMap.get('image.read'),
          permissionMap.get('user.profile'),
          permissionMap.get('api.read')
        ]
      },
      {
        name: 'viewer',
        description: 'Content Viewer - Read-only access',
        permissions: [
          permissionMap.get('content.read'),
          permissionMap.get('image.read'),
          permissionMap.get('user.profile'),
          permissionMap.get('analytics.view'),
          permissionMap.get('api.read')
        ]
      },
      {
        name: 'guest',
        description: 'Guest User - Limited access',
        permissions: [
          permissionMap.get('content.read'),
          permissionMap.get('user.profile')
        ]
      }
    ];

    // Create roles
    const roleMap = new Map();
    for (const roleData of roles) {
      let role = await Role.findOne({ name: roleData.name });
      if (!role) {
        role = await Role.create(roleData);
        console.log(`✅ Role created: ${roleData.name}`);
      } else {
        // Update permissions if role exists
        role.permissions = roleData.permissions;
        await role.save();
        console.log(`✅ Role updated: ${roleData.name}`);
      }
      roleMap.set(roleData.name, role._id);
    }

    console.log("🎉 Roles and Permissions seeding completed!");
    return { roleMap, permissionMap };
    
  } catch (error) {
    console.error('❌ Roles and Permissions seeding error:', error.message);
    throw error;
  }
};

module.exports = seedRolesAndPermissions;