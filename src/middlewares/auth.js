// middlewares/auth.js - Combined authentication and authorization
const User = require('../models/user');
const Role = require('../models/role');
const jwt = require('jsonwebtoken');

// Basic JWT authentication
const authenticate = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findById(decoded.user.id).populate('role').select('username email role');
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    req.user = { 
      id: user._id, 
      username: user.username,
      email: user.email,
      role: user.role
    };
    
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Role-based authorization
const requireRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ message: 'User not authenticated' });
      }
      
      // Check if role is already populated from authenticate middleware
      let userRole;
      if (req.user.role && req.user.role.name) {
        userRole = req.user.role.name;
      } else {
        const user = await User.findById(req.user.id).populate('role');
        if (!user || !user.role) {
          return res.status(401).json({ message: 'User role not found' });
        }
        userRole = user.role.name;
        req.user.role = user.role;
      }

      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({ 
          message: 'Access denied. Insufficient permissions.',
          required: allowedRoles,
          current: userRole
        });
      }

      next();
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };
};

// Permission-based authorization (simplified)
const requirePermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      // For now, just check if user has role - permissions can be added later
      if (!req.user || !req.user.role) {
        return res.status(401).json({ message: 'User not authenticated' });
      }
      next();
    } catch (error) {
      res.status(500).json({ 
        message: 'Permission check failed', 
        error: error.message 
      });
    }
  };
};

// Convenience role functions
const requireSuperAdmin = requireRole(['superadmin']);
const requireAdminOrAbove = requireRole(['superadmin', 'admin']);
const requireEditorOrAbove = requireRole(['superadmin', 'admin', 'editor']);

module.exports = {
  authenticate,
  requireRole,
  requireSuperAdmin,
  requireAdminOrAbove,
  requireEditorOrAbove
};

// Default export for backward compatibility
module.exports.default = authenticate;