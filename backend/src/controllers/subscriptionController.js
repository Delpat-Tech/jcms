const Subscription = require('../models/subscription');
const SubscriptionPlan = require('../models/subscriptionPlan');

const DEFAULT_PLANS = [
  {
    name: 'free',
    displayName: 'Free',
    priceCents: 0,
    currency: 'USD',
    durationDays: 0, // no expiry, treated as limited access
    features: ['Limited articles'],
    limits: { maxArticles: 5, premiumMedia: false },
  },
  {
    name: 'standard',
    displayName: 'Standard',
    priceCents: 999,
    currency: 'USD',
    durationDays: 30,
    features: ['Full articles access'],
    limits: { maxArticles: -1, premiumMedia: false },
  },
  {
    name: 'premium',
    displayName: 'Premium',
    priceCents: 1999,
    currency: 'USD',
    durationDays: 30,
    features: ['Full articles + premium media (PDF, video)'],
    limits: { maxArticles: -1, premiumMedia: true },
  }
];

async function ensureDefaultPlans() {
  const count = await SubscriptionPlan.countDocuments();
  if (count === 0) {
    await SubscriptionPlan.insertMany(DEFAULT_PLANS);
  }
}

const getPlans = async (req, res) => {
  try {
    await ensureDefaultPlans();
    const plans = await SubscriptionPlan.find({ isActive: true }).sort({ priceCents: 1 });
    return res.status(200).json(plans);
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch plans', error: err.message });
  }
};

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

async function getActiveSubscription(userId) {
  const now = new Date();
  const sub = await Subscription.findOne({ user: userId, status: { $in: ['active', 'pending'] } }).sort({ createdAt: -1 });
  if (!sub) return null;

  // Auto-expire if past expiryDate (except for free with duration 0)
  if (sub.expiryDate && sub.expiryDate < now && sub.status !== 'expired') {
    sub.status = 'expired';
    await sub.save();
  }
  return sub;
}

const createSubscription = async (req, res) => {
  try {
    const { plan } = req.body;
    if (!plan) return res.status(400).json({ success: false, message: 'Plan is required' });

    const planDoc = await SubscriptionPlan.findOne({ name: plan.toLowerCase(), isActive: true });
    if (!planDoc) return res.status(404).json({ success: false, message: 'Plan not found' });

    // Calculate expiry: free plan with duration 0 => set expiry far future but mark as active
    let expiryDate;
    if (planDoc.durationDays && planDoc.durationDays > 0) {
      expiryDate = addDays(new Date(), planDoc.durationDays);
    } else {
      expiryDate = addDays(new Date(), 3650); // ~10 years for free plan
    }

    const subscription = await Subscription.create({
      user: req.user.id,
      plan: planDoc.name,
      startDate: new Date(),
      expiryDate,
      paymentStatus: planDoc.priceCents > 0 ? 'pending' : 'paid',
      status: planDoc.priceCents > 0 ? 'active' : 'active',
    });

    // Mock payment: if free, instantly considered paid
    return res.status(201).json({ success: true, message: 'Subscription created', data: subscription });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to create subscription', error: err.message });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const { paymentReference } = req.body;
    if (!paymentReference) return res.status(400).json({ success: false, message: 'paymentReference required' });

    const sub = await getActiveSubscription(req.user.id);
    if (!sub) return res.status(404).json({ success: false, message: 'No active subscription found' });
    if (sub.paymentStatus === 'paid') return res.status(200).json({ success: true, message: 'Already paid' });

    // Mock verify: any non-empty reference succeeds
    sub.paymentStatus = 'paid';
    sub.paymentReference = paymentReference;
    await sub.save();

    return res.status(200).json({ success: true, message: 'Payment verified', data: sub });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to verify payment', error: err.message });
  }
};

const getStatus = async (req, res) => {
  try {
    const sub = await getActiveSubscription(req.user.id);
    if (!sub) return res.status(200).json({ active: false, plan: 'free', expiresAt: null });

    const now = new Date();
    const active = sub.status === 'active' && sub.expiryDate > now;
    return res.status(200).json({
      active,
      plan: sub.plan,
      paymentStatus: sub.paymentStatus,
      expiresAt: sub.expiryDate,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch status', error: err.message });
  }
};

module.exports = {
  getPlans,
  createSubscription,
  verifyPayment,
  getStatus,
  getActiveSubscription,
};
