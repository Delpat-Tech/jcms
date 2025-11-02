const express = require('express');
const { authenticate, requireActiveUser } = require('../middlewares/auth');
const { getCleanupStatus, runCleanupManual, getExpiringFiles } = require('../controllers/cleanupController');

const router = express.Router();

// Get cleanup job status
router.get('/status', authenticate, requireActiveUser, getCleanupStatus);

// Run manual cleanup (superadmin only)
router.post('/run', authenticate, requireActiveUser, runCleanupManual);

// Get files expiring soon
router.get('/expiring', authenticate, requireActiveUser, getExpiringFiles);

module.exports = router;