const Subscription = require('../models/subscription');

/**
 * Middleware to check user's subscription before accessing protected content.
 * Usage: checkSubscription('standard') or checkSubscription('premium')
 */
function checkSubscription(requiredPlan = 'free') {
  return async (req, res, next) => {
    try {
      // Superadmin bypasses subscription checks
      const roleName = req?.user?.role?.name || req?.user?.role;
      if (roleName === 'superadmin') {
        return next();
      }

      if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

      const tenantId = req.user.tenant?._id || req.user.tenant;
      
      // No tenant = allow (for testing)
      if (!tenantId) {
        return next();
      }

      // Check tenant subscription
      const sub = await Subscription.findOne({ 
        tenant: tenantId,
        isActive: true,
        isExpired: false,
        endDate: { $gt: new Date() }
      });
      
      // Has active subscription = allow
      if (sub) {
        return next();
      }

      // No subscription = block
      return res.status(402).json({ success: false, message: 'Subscription required', requiredPlan });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Subscription verification failed', error: err.message });
    }
  };
}

module.exports = { checkSubscription };
