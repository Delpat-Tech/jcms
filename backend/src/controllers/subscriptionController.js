const Razorpay = require('razorpay');
const crypto = require('crypto');
const Subscription = require('../models/subscription');
const Tenant = require('../models/tenant');
const subscriptionService = require('../services/subscriptionService');
const logger = require('../config/logger');

// Subscription prices (in INR)
const SUBSCRIPTION_PRICES = {
  Monthly: 999,  // ₹999 from standard plan
  Yearly: 4999   // ₹1999 from premium plan
};

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create Razorpay order
exports.createOrder = async (req, res) => {
  try {
    const { subtype } = req.body;
    
    if (!req.user || (!req.user.id && !req.user._id)) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated properly'
      });
    }
    
    const userId = req.user.id || req.user._id;
    const tenantId = req.user.tenant?._id || req.user.tenant;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant ID is required for subscription'
      });
    }

    if (!['Yearly', 'Monthly'].includes(subtype)) {
      return res.status(400).json({
        success: false,
        message: "Invalid subscription type. Allowed types: 'Yearly', 'Monthly'."
      });
    }

    const amount = SUBSCRIPTION_PRICES[subtype];
    const options = {
      amount: amount * 100, // amount in paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1,
      notes: {
        subtype: subtype,
        tenantId: tenantId.toString(),
        userId: userId.toString()
      }
    };

    const order = await razorpay.orders.create(options);
    
    if (!order) {
      return res.status(400).json({
        success: false,
        message: 'Error creating order'
      });
    }

    logger.info('Razorpay order created', { orderId: order.id, tenantId, subtype });

    res.status(200).json({
      success: true,
      message: 'Order created successfully',
      data: {
        order,
        amount,
        currency: 'INR',
        keyId: process.env.RAZORPAY_KEY_ID
      }
    });
  } catch (error) {
    logger.error('Error creating order:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error creating order',
      error: error.message 
    });
  }
};

// Verify payment and update subscription (for client-side)
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, subtype } = req.body;
    const tenantId = req.user.tenant?._id || req.user.tenant;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant ID is required'
      });
    }

    if (!['Yearly', 'Monthly'].includes(subtype)) {
      return res.status(400).json({
        success: false,
        message: "Invalid subscription type. Allowed types: 'Yearly', 'Monthly'."
      });
    }

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }

    const amount = SUBSCRIPTION_PRICES[subtype];
    const currentDate = new Date();
    let startDate = currentDate;
    let endDate;

    // Check if tenant has existing active subscription
    const existingSubscription = await Subscription.findOne({
      tenant: tenantId,
      isActive: true,
      isExpired: false
    });

    if (existingSubscription && existingSubscription.endDate > currentDate) {
      // Extend from current expiry date
      startDate = existingSubscription.endDate;
    }

    // Calculate end date based on subscription type
    if (subtype === 'Yearly') {
      endDate = new Date(startDate);
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
    }

    // Always deactivate existing subscriptions when creating new one
    await Subscription.updateMany(
      { tenant: tenantId },
      { $set: { isActive: false } }
    );

    // Create new subscription
    const newSubscription = await Subscription.create({
      tenant: tenantId,
      subscriptionType: subtype,
      startDate,
      endDate,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      amount,
      paymentStatus: 'completed',
      isActive: true,
      isExpired: false
    });

    // Remove expiration dates from existing files
    try {
      await subscriptionService.activateSubscriptionBenefits(tenantId);
    } catch (error) {
      logger.warn('Failed to activate subscription benefits', { error: error.message });
    }

    logger.info('Subscription created successfully', {
      subscriptionId: newSubscription._id,
      tenantId,
      subscriptionType: subtype,
      endDate
    });

    res.status(200).json({
      success: true,
      message: 'Payment verified and subscription updated successfully',
      data: {
        subscription: newSubscription
      }
    });
  } catch (error) {
    logger.error('Error verifying payment:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying payment',
      error: error.message
    });
  }
};

// Webhook handler for Razorpay events
exports.handleWebhook = async (req, res) => {
  try {
    if (req.body.event === 'payment.captured') {
      const razorpayPaymentId = req.body.payload.payment.entity.id;
      const razorpayOrderId = req.body.payload.payment.entity.order_id;
      const subscriptionType = req.body.payload.payment.entity.notes.subtype;
      const tenantId = req.body.payload.payment.entity.notes.tenantId;
      const amount = req.body.payload.payment.entity.amount / 100; // Convert from paise

      if (!tenantId) {
        return res.status(400).json({
          success: false,
          message: 'Tenant not found'
        });
      }

      if (!['Yearly', 'Monthly'].includes(subscriptionType)) {
        return res.status(400).json({
          success: false,
          message: "Invalid subscription type. Allowed types: 'Yearly', 'Monthly'."
        });
      }

      // Find the tenant
      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        return res.status(404).json({
          success: false,
          message: 'Tenant not found'
        });
      }

      const currentDate = new Date();
      let startDate = currentDate;
      let endDate;

      // Check if tenant has existing active subscription
      const existingSubscription = await Subscription.findOne({
        tenant: tenantId,
        isActive: true,
        isExpired: false
      });

      if (existingSubscription && existingSubscription.endDate > currentDate) {
        // Extend from current expiry date
        startDate = existingSubscription.endDate;
      }

      // Calculate end date based on subscription type
      if (subscriptionType === 'Yearly') {
        endDate = new Date(startDate);
        endDate.setFullYear(endDate.getFullYear() + 1);
      } else {
        endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);
      }

      // Deactivate existing subscriptions
      await Subscription.updateMany(
        { tenant: tenantId },
        { $set: { isActive: false } }
      );

      // Create new subscription
      const newSubscription = await Subscription.create({
        tenant: tenantId,
        subscriptionType,
        startDate,
        endDate,
        razorpayOrderId,
        razorpayPaymentId,
        amount,
        paymentStatus: 'completed',
        isActive: true,
        isExpired: false
      });

      // Remove expiration dates from existing files
      try {
        await subscriptionService.activateSubscriptionBenefits(tenantId);
      } catch (error) {
        logger.warn('Failed to activate subscription benefits via webhook', { error: error.message });
      }

      logger.info('Subscription created via webhook', {
        subscriptionId: newSubscription._id,
        tenantId,
        subscriptionType,
        endDate
      });

      res.status(200).json({
        success: true,
        message: 'Payment verified and subscription updated successfully',
        data: {
          subscription: newSubscription
        }
      });
    } else {
      res.status(200).json({
        success: true,
        message: 'Event received but not processed'
      });
    }
  } catch (error) {
    logger.error('Error handling webhook:', error);
    res.status(500).json({
      success: false,
      message: 'Error handling webhook',
      error: error.message
    });
  }
};

// Get subscription status
exports.getSubscriptionStatus = async (req, res) => {
  try {
    // Superadmin always has premium access
    if (req.user.role?.name === 'superadmin') {
      return res.status(200).json({
        success: true,
        message: 'Superadmin has premium access',
        data: {
          hasActiveSubscription: true,
          subscription: {
            subscriptionType: 'Premium',
            isActive: true,
            isExpired: false,
            endDate: null // No expiration for superadmin
          }
        }
      });
    }

    const tenantId = req.user.tenant?._id || req.user.tenant;
    
    if (!tenantId) {
      return res.status(200).json({
        success: true,
        message: 'No tenant found - treating as premium',
        data: {
          hasActiveSubscription: true,
          subscription: null
        }
      });
    }

    const subscription = await Subscription.findOne({
      tenant: tenantId,
      isActive: true,
      isExpired: false,
      endDate: { $gt: new Date() }
    }).populate('tenant', 'name domain').sort({ createdAt: -1 });

    if (!subscription) {
      return res.status(200).json({
        success: true,
        message: 'No active subscription found',
        data: {
          hasActiveSubscription: false,
          subscription: null
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Subscription status retrieved successfully',
      data: {
        hasActiveSubscription: true,
        subscription
      }
    });
  } catch (error) {
    logger.error('Error getting subscription status:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting subscription status',
      error: error.message
    });
  }
};

// Get subscription prices
exports.getSubscriptionPrices = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Subscription prices retrieved successfully',
      data: {
        prices: SUBSCRIPTION_PRICES,
        currency: 'INR'
      }
    });
  } catch (error) {
    logger.error('Error getting subscription prices:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting subscription prices',
      error: error.message
    });
  }
};

// Cancel subscription
exports.cancelSubscription = async (req, res) => {
  try {
    const tenantId = req.user.tenant?._id || req.user.tenant;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant ID is required'
      });
    }

    const subscription = await Subscription.findOneAndUpdate(
      { tenant: tenantId, isActive: true },
      { $set: { isActive: false } },
      { new: true }
    );

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'No active subscription found'
      });
    }

    logger.info('Subscription cancelled', { subscriptionId: subscription._id, tenantId });

    res.status(200).json({
      success: true,
      message: 'Subscription cancelled successfully',
      data: { subscription }
    });
  } catch (error) {
    logger.error('Error cancelling subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling subscription',
      error: error.message
    });
  }
};

// Admin: Get all subscriptions
exports.getAllSubscriptions = async (req, res) => {
  try {
    const subscriptions = await Subscription.find({})
      .populate('tenant', 'name domain')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'All subscriptions retrieved successfully',
      data: { subscriptions }
    });
  } catch (error) {
    logger.error('Error getting all subscriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting subscriptions',
      error: error.message
    });
  }
};

// Admin: Get subscription by tenant ID
exports.getSubscriptionByTenant = async (req, res) => {
  try {
    const { tenantId } = req.params;
    
    const subscription = await Subscription.findOne({
      tenant: tenantId,
      isActive: true
    }).populate('tenant', 'name domain');

    res.status(200).json({
      success: true,
      message: 'Subscription retrieved successfully',
      data: { subscription }
    });
  } catch (error) {
    logger.error('Error getting subscription by tenant:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting subscription',
      error: error.message
    });
  }
};

// Admin: Cancel any subscription
exports.adminCancelSubscription = async (req, res) => {
  try {
    const { tenantId } = req.params;
    
    const subscription = await Subscription.findOneAndUpdate(
      { tenant: tenantId, isActive: true },
      { $set: { isActive: false } },
      { new: true }
    ).populate('tenant', 'name domain');

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'No active subscription found for this tenant'
      });
    }

    logger.info('Admin cancelled subscription', { 
      subscriptionId: subscription._id, 
      tenantId,
      adminId: req.user.id || req.user._id
    });

    res.status(200).json({
      success: true,
      message: 'Subscription cancelled successfully',
      data: { subscription }
    });
  } catch (error) {
    logger.error('Error admin cancelling subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling subscription',
      error: error.message
    });
  }
};