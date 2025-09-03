// middlewares/roleAuth.js
const User = require('../models/user');
const Role = require('../models/role');

const requireRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ message: 'User not authenticated' });
      }
      
      const user = await User.findById(req.user.id).populate('role');
      
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      if (!allowedRoles.includes(user.role.name)) {
        return res.status(403).json({ 
          message: 'Access denied. Insufficient permissions.',
          required: allowedRoles,
          current: user.role.name
        });
      }

      req.user.role = user.role.name;
      next();
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };
};

const requireSuperAdmin = requireRole(['superadmin']);
const requireAdminOrAbove = requireRole(['superadmin', 'admin']);
const requireEditorOrAbove = requireRole(['superadmin', 'admin', 'editor']);

module.exports = {
  requireRole,
  requireSuperAdmin,
  requireAdminOrAbove,
  requireEditorOrAbove
};