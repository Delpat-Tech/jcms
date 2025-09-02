// src/seeds/seedRolesAndPermissions.js
const mongoose = require('mongoose');
const Role = require('../models/role');
const Permission = require('../models/permission');
const Tenant = require('../models/tenant');

const seedRolesAndPermissions = async () => {
  try {
    console.log("🔐 Seeding Roles and Permissions...");
    
    // Create System Tenant first
    let systemTenant = await Tenant.findOne({ name: 'System' });
    if (!systemTenant) {
      systemTenant = await Tenant.create({
        name: 'System',
        domain: 'system.local',
        isActive: true
      });
      console.log(`✅ System tenant created: ${systemTenant._id}`);
    }

    // Define permissions
    const permissions = [
      // User Management
      { name: 'user.create', description: 'Create users' },
      { name: 'user.read', description: 'View users' },
      { name: 'user.update', description: 'Update users' },
      { name: 'user.delete', description: 'Delete users' },
      
      // Role Management
      { name: 'role.create', description: 'Create roles' },
      { name: 'role.read', description: 'View roles' },
      { name: 'role.update', description: 'Update roles' },
      { name: 'role.delete', description: 'Delete roles' },
      
      // Content Management
      { name: 'content.create', description: 'Create content' },
      { name: 'content.read', description: 'View content' },
      { name: 'content.update', description: 'Update content' },
      { name: 'content.delete', description: 'Delete content' },
      { name: 'content.publish', description: 'Publish content' },
      
      // System Management
      { name: 'system.settings', description: 'Manage system settings' },
      { name: 'system.logs', description: 'View system logs' },
      { name: 'tenant.manage', description: 'Manage tenants' }
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
        name: 'admin',
        description: 'System Administrator',
        permissions: Array.from(permissionMap.values()) // All permissions
      },
      {
        name: 'editor',
        description: 'Content Editor',
        permissions: [
          permissionMap.get('content.create'),
          permissionMap.get('content.read'),
          permissionMap.get('content.update'),
          permissionMap.get('content.publish'),
          permissionMap.get('user.read')
        ]
      },
      {
        name: 'viewer',
        description: 'Content Viewer',
        permissions: [
          permissionMap.get('content.read'),
          permissionMap.get('user.read')
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
    return { systemTenant, roleMap, permissionMap };
    
  } catch (error) {
    console.error('❌ Roles and Permissions seeding error:', error.message);
    throw error;
  }
};

module.exports = seedRolesAndPermissions;