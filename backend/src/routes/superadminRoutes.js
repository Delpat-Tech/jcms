// src/routes/superadminRoutes.js
const express = require('express');
const { backupDatabase } = require('../utils/backup');
const { authenticate, requireSuperAdmin } = require('../middlewares/auth');
const router = express.Router();

// All routes require authentication and superadmin role
router.use(authenticate, requireSuperAdmin);

// Database backup endpoint
router.post('/backup', async (req, res) => {
  try {
    const result = await backupDatabase();
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Backup failed', 
      error: error.message 
    });
  }
});

module.exports = router;