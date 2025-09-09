// src/middlewares/rbac.js - Enhanced RBAC middleware
const Permission = require('../models/permission');
const logger = require('../config/logger');

// Permission definitions
const PERMISSIONS = {
  // User permissions
  'users.create': { resource: 'users', action: 'create', scope: 'all' },
  'users.read': { resource: 'users', action: 'read', scope: 'all' },
  'users.update': { resource: 'users', action: 'update', scope: 'all' },
  'users.delete': { resource: 'users', action: 'delete', scope: 'all' },
  
  // Image permissions
  'images.create': { resource: 'images', action: 'create', scope: 'own' },
  'images.read.own': { resource: 'images', action: 'read', scope: 'own' },
  'images.read.all': { resource: 'images', action: 'read', scope: 'all' },
  'images.update.own': { resource: 'images', action: 'update', scope: 'own' },
  'images.update.all': { resource: 'images', action: 'update', scope: 'all' },
  'images.delete.own': { resource: 'images', action: 'delete', scope: 'own' },
  'images.delete.all': { resource: 'images', action: 'delete', scope: 'all' }
};

// Role-Permission mapping
const ROLE_PERMISSIONS = {
  superadmin: [
    'users.create', 'users.read', 'users.update', 'users.delete',
    'images.create', 'images.read.all', 'images.update.all', 'images.delete.all'
  ],
  admin: [
    'users.create', 'users.read', 'users.update', 'users.delete',
    'images.create', 'images.read.all', 'images.update.own', 'images.delete.own'
  ],
  editor: [
    'images.create', 'images.read.own', 'images.update.own', 'images.delete.own'
  ],
  viewer: [
    'images.read.own'
  ]
};

// Check if user has permission
const hasPermission = (userRole, permission) => {
  return ROLE_PERMISSIONS[userRole]?.includes(permission) || false;
};

// Middleware to check permissions
const requirePermission = (permission) => {
  return (req, res, next) => {
    try {
      const userRole = req.user.role.name;
      
      if (!hasPermission(userRole, permission)) {
        logger.warn('Permission denied', {
          userId: req.user.id,
          userRole,
          permission,
          resource: req.originalUrl
        });
        
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions',
          required: permission,
          userRole
        });
      }
      
      next();
    } catch (error) {
      logger.error('Permission check failed', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Permission check failed'
      });
    }
  };
};

// Resource-based permission check
const checkResourceAccess = async (user, resource, resourceId, action) => {
  const permission = `${resource}.${action}`;
  const userRole = user.role.name;
  
  // Check if user has the permission
  if (!hasPermission(userRole, permission)) {
    // Check for 'own' scope permission
    const ownPermission = `${resource}.${action}.own`;
    if (hasPermission(userRole, ownPermission)) {
      // Verify ownership
      const Model = require(`../models/${resource.slice(0, -1)}`); // Remove 's' from resource name
      const item = await Model.findById(resourceId);
      return item && item.user.toString() === user.id;
    }
    return false;
  }
  
  return true;
};

module.exports = {
  requirePermission,
  hasPermission,
  checkResourceAccess,
  PERMISSIONS,
  ROLE_PERMISSIONS
};