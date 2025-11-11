// middlewares/auth.js - Combined authentication and authorization
const User = require('../models/user');
const Role = require('../models/role');
const jwt = require('jsonwebtoken');

// Basic JWT authentication
const authenticate = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '') || req.query.token;

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Token decoded successfully
    
    const user = await User.findById(decoded.user.id)
      .populate('role', 'name')
      .populate('tenant', 'name')
      .select('username email role tenant isActive isTemporary expiresAt')
      .lean();
    if (!user) {
      // User not found
      return res.status(401).json({ message: 'User not found' });
    }
    
    // Check if temporary user has expired
    if (user.isTemporary && user.expiresAt && new Date() > new Date(user.expiresAt)) {
      const Tenant = require('../models/tenant');
      const Subscription = require('../models/subscription');
      
      if (user.tenant) {
        await Subscription.deleteMany({ tenant: user.tenant });
        await Tenant.findByIdAndDelete(user.tenant);
      }
      await User.findByIdAndDelete(user._id);
      return res.status(401).json({ message: 'Temporary session expired. Please register again.' });
    }
    
    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is deactivated. Please contact administrator.' });
    }
    
    req.user = { 
      id: user._id, 
      username: user.username,
      email: user.email,
      role: user.role,
      tenant: user.tenant,
      isActive: user.isActive
    };
    
    // User context set
    next();
  } catch (err) {
    // JWT verification failed
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

// Tenant filtering middleware
const addTenantFilter = (req, res, next) => {
  if (req.user.role.name === 'superadmin') {
    // Superadmin can see all data
    req.tenantFilter = {};
  } else {
    // All other users can only see their tenant's data
    req.tenantFilter = { tenant: req.user.tenant?._id || null };
  }
  next();
};

// Check if user is active (for non-auth routes)
const requireActiveUser = (req, res, next) => {
  if (!req.user.isActive) {
    return res.status(403).json({ message: 'Account is deactivated. Please contact administrator.' });
  }
  next();
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
  requireEditorOrAbove,
  requireActiveUser,
  addTenantFilter
};

// Default export for backward compatibility
module.exports.default = authenticate;