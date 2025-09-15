// src/middlewares/superadminValidation.js
const User = require('../models/user');
const Role = require('../models/role');
const logger = require('../config/logger');

const validateSingleSuperAdmin = async (req, res, next) => {
  try {
    // Check if trying to create or update to superadmin role
    const { role } = req.body;
    
    if (role === 'superadmin') {
      logger.warn('Attempt to create/assign superadmin role blocked', {
        userId: req.user?.id,
        requestBody: req.body
      });
      
      return res.status(403).json({
        success: false,
        message: 'Superadmin role cannot be assigned. Only one superadmin exists and is managed by the system.'
      });
    }
    
    next();
  } catch (error) {
    logger.error('Superadmin validation error', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Error validating superadmin constraint',
      error: error.message
    });
  }
};

// Prevent any modification of the system superadmin
const protectSystemSuperAdmin = async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    if (userId) {
      const targetUser = await User.findById(userId).populate('role');
      
      if (targetUser && targetUser.role && targetUser.role.name === 'superadmin') {
        // Check if this is the system superadmin (from .env)
        const systemSuperAdminUsername = process.env.SUPER_ADMIN_USERNAME || process.env.SUPER_ADMIN_LOGIN_ID || 'superadmin';
        
        if (targetUser.username === systemSuperAdminUsername) {
          logger.warn('Attempt to modify system superadmin blocked', {
            userId: req.user?.id,
            targetUserId: userId,
            action: req.method
          });
          
          return res.status(403).json({
            success: false,
            message: 'The system superadmin cannot be modified or deleted. This account is protected.'
          });
        }
      }
    }
    
    next();
  } catch (error) {
    logger.error('System superadmin protection error', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Error protecting system superadmin',
      error: error.message
    });
  }
};

module.exports = { 
  validateSingleSuperAdmin, 
  protectSystemSuperAdmin 
};