// middlewares/activityLogger.js
const { notifyAdmins } = require('../services/socketService');
const logger = require('../config/logger');

const logActivity = (action, resource) => {
  return async (req, res, next) => {
    // Store original res.json to intercept response
    const originalJson = res.json;
    
    res.json = async function(data) {
      // Only log successful operations
      if (data.success !== false) {
        // Get user details from database to ensure we have complete info
        let userInfo = { username: 'Unknown', userRole: 'Unknown' };
        if (req.user?.id) {
          try {
            const User = require('../models/user');
            const user = await User.findById(req.user.id).populate('role');
            if (user) {
              userInfo = {
                username: user.username,
                userRole: user.role?.name || 'Unknown'
              };
            }
          } catch (error) {
            logger.error('Error fetching user for activity log', { error: error.message, userId: req.user?.id, stack: error.stack });
          }
        }

        const activityData = {
          action,
          resource,
          userId: req.user?.id,
          username: userInfo.username,
          userRole: userInfo.userRole,
          resourceId: req.params.id || req.params.userId || data.data?.id,
          details: {
            method: req.method,
            path: req.path,
            ip: req.ip,
            userAgent: req.get('User-Agent')
          }
        };

        // Notify admins via WebSocket
        logger.debug('Activity logged', activityData);
        notifyAdmins('user_activity', activityData);
      }
      
      // Call original res.json
      return originalJson.call(this, data);
    };
    
    next();
  };
};

module.exports = { logActivity };