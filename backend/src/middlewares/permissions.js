// src/middlewares/permissions.js
const User = require('../models/user');
const Role = require('../models/role');

const requirePermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id).select('role');
      
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      // Get role with populated permissions
      const role = await Role.findOne({ name: user.role }).populate('permissions');
      
      if (!role) {
        return res.status(403).json({ 
          message: 'Invalid role assigned to user' 
        });
      }

      // Check if user has required permission
      const hasPermission = role.permissions.some(
        permission => permission.name === requiredPermission
      );

      if (!hasPermission) {
        return res.status(403).json({ 
          message: 'Access denied. Insufficient permissions.',
          required: requiredPermission,
          userRole: user.role
        });
      }

      req.user.role = user.role;
      req.user.permissions = role.permissions.map(p => p.name);
      next();
    } catch (error) {
      res.status(500).json({ 
        message: 'Permission check failed', 
        error: error.message 
      });
    }
  };
};

const requireAnyPermission = (requiredPermissions) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id).select('role');
      
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      const role = await Role.findOne({ name: user.role }).populate('permissions');
      
      if (!role) {
        return res.status(403).json({ 
          message: 'Invalid role assigned to user' 
        });
      }

      // Check if user has any of the required permissions
      const hasAnyPermission = role.permissions.some(
        permission => requiredPermissions.includes(permission.name)
      );

      if (!hasAnyPermission) {
        return res.status(403).json({ 
          message: 'Access denied. Insufficient permissions.',
          required: requiredPermissions,
          userRole: user.role
        });
      }

      req.user.role = user.role;
      req.user.permissions = role.permissions.map(p => p.name);
      next();
    } catch (error) {
      res.status(500).json({ 
        message: 'Permission check failed', 
        error: error.message 
      });
    }
  };
};

module.exports = {
  requirePermission,
  requireAnyPermission
};