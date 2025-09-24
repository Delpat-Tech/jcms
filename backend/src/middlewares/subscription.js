const Subscription = require('../models/subscription');

/**
 * Middleware to check user's subscription before accessing protected content.
 * Usage: checkSubscription('standard') or checkSubscription('premium')
 */
function checkSubscription(requiredPlan = 'free') {
  const hierarchy = { free: 0, standard: 1, premium: 2 };

  return async (req, res, next) => {
    try {
      // Superadmin bypasses subscription checks entirely
      const roleName = req?.user?.role?.name || req?.user?.role;
      if (roleName === 'superadmin') {
        return next();
      }

      if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

      const sub = await Subscription.findOne({ user: req.user.id }).sort({ createdAt: -1 });
      if (!sub) {
        // No subscription saved => treat as free
        if (hierarchy[requiredPlan] <= hierarchy['free']) return next();
        return res.status(402).json({ success: false, message: 'Subscription required', requiredPlan });
      }

      const now = new Date();
      const active = sub.status === 'active' && sub.expiryDate > now && (sub.paymentStatus === 'paid' || sub.plan === 'free');
      if (!active) {
        if (hierarchy[requiredPlan] <= hierarchy['free']) return next();
        return res.status(402).json({ success: false, message: 'Subscription inactive or expired', requiredPlan });
      }

      if (hierarchy[sub.plan] >= hierarchy[requiredPlan]) {
        return next();
      }

      return res.status(403).json({ success: false, message: 'Insufficient plan level', have: sub.plan, required: requiredPlan });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Subscription verification failed', error: err.message });
    }
  };
}

module.exports = { checkSubscription };
