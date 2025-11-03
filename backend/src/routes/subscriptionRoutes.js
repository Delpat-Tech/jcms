const express = require('express');
const subscriptionController = require('../controllers/subscriptionController');
const { authenticate } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/roleAuth');

const router = express.Router();

// Public route for webhook (with raw body for signature verification)
router.post('/webhook', express.raw({type: 'application/json'}), subscriptionController.handleWebhook);

// Public route for subscription prices
router.get('/prices', subscriptionController.getSubscriptionPrices);

// Protected routes (require authentication)
router.use(authenticate);

// User subscription management routes
router.post('/create-order', subscriptionController.createOrder);
router.post('/verify-payment', subscriptionController.verifyPayment);
router.get('/status', subscriptionController.getSubscriptionStatus);
router.delete('/cancel', subscriptionController.cancelSubscription);

// Admin routes (require admin or superadmin role)
router.get('/admin/all', requireRole(['admin', 'superadmin']), subscriptionController.getAllSubscriptions);
router.get('/admin/tenant/:tenantId', requireRole(['admin', 'superadmin']), subscriptionController.getSubscriptionByTenant);
router.delete('/admin/tenant/:tenantId/cancel', requireRole(['admin', 'superadmin']), subscriptionController.adminCancelSubscription);

module.exports = router;