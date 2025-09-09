// src/middlewares/superadminValidation.js
const User = require('../models/user');
const Role = require('../models/role');

const validateSingleSuperAdmin = async (req, res, next) => {
  try {
    // Check if trying to create or update to superadmin role
    const { role } = req.body;
    
    if (role === 'superadmin') {
      // Check if superadmin already exists
      const superadminRole = await Role.findOne({ name: 'superadmin' });
      if (!superadminRole) {
        return res.status(500).json({ success: false, message: 'Superadmin role not found in system' });
      }
      const existingSuperAdmin = await User.findOne({ role: superadminRole._id });
      
      if (existingSuperAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Only one superadmin is allowed in the system'
        });
      }
    }
    
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error validating superadmin constraint',
      error: error.message
    });
  }
};

module.exports = { validateSingleSuperAdmin };