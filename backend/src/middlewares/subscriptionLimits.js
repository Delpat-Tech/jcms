const Subscription = require('../models/subscription');

const LIMITS = {
  FREE: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxAdmins: 1,
    maxEditors: 1,
    fileExpirationDays: 15
  },
  SUBSCRIBED: {
    maxFileSize: 100 * 1024 * 1024, // 100MB
    maxAdmins: 1,
    maxEditors: 10,
    fileExpirationDays: null // No expiration
  }
};

const checkSubscriptionLimits = async (req, res, next) => {
  try {
    const tenantId = req.user.tenant?._id || req.user.tenant;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant ID is required'
      });
    }

    // Check if tenant has active subscription
    const subscription = await Subscription.findOne({
      tenant: tenantId,
      isActive: true,
      isExpired: false
    });

    const hasActiveSubscription = subscription && new Date(subscription.endDate) > new Date();
    
    req.subscriptionLimits = hasActiveSubscription ? LIMITS.SUBSCRIBED : LIMITS.FREE;
    req.hasActiveSubscription = hasActiveSubscription;
    
    next();
  } catch (error) {
    console.error('Error checking subscription limits:', error);
    // Default to free limits on error
    req.subscriptionLimits = LIMITS.FREE;
    req.hasActiveSubscription = false;
    next();
  }
};

module.exports = { checkSubscriptionLimits, LIMITS };