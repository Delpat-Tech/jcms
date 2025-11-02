const express = require('express');
const { authenticate, requireActiveUser } = require('../middlewares/auth');
const { getCleanupStatus, runCleanupManual, getExpiringFiles } = require('../controllers/cleanupController');
const subscriptionExpirationJob = require('../jobs/subscriptionExpirationJob');

const router = express.Router();

// Get cleanup job status
router.get('/status', authenticate, requireActiveUser, getCleanupStatus);

// Run manual cleanup (superadmin only)
router.post('/run', authenticate, requireActiveUser, runCleanupManual);

// Get files expiring soon
router.get('/expiring', authenticate, requireActiveUser, getExpiringFiles);

// Check expired subscriptions (superadmin only)
router.post('/check-subscriptions', authenticate, requireActiveUser, async (req, res) => {
  try {
    if (req.user.role?.name !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Only superadmin can check expired subscriptions'
      });
    }

    const results = await subscriptionExpirationJob.runManual();
    
    res.json({
      success: true,
      message: 'Subscription expiration check completed',
      data: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;