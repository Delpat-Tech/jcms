const express = require('express');
const { authenticate } = require('../middlewares/auth');
const { 
  getPlans, 
  createSubscription, 
  verifyPayment, 
  getStatus, 
  cancelSubscription, 
  getPaymentHistory, 
  getInvoice 
} = require('../controllers/subscriptionController');

const router = express.Router();

// Public: fetch available plans
router.get('/plans', getPlans);

// Authenticated: manage own subscription
router.use(authenticate);
router.get('/status', getStatus);
router.post('/', createSubscription);
router.post('/verify', verifyPayment);
router.post('/cancel', cancelSubscription);
router.get('/history', getPaymentHistory);
router.get('/invoice/:invoiceId', getInvoice);

module.exports = router;
