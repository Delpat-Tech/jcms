// routes/activityRoutes.js
const express = require('express');
const { authenticate, requireAdminOrAbove } = require('../middlewares/auth');
const ActivityLog = require('../models/activityLog');
const router = express.Router();

router.use(authenticate, requireAdminOrAbove);

// Get activity logs with filtering
router.get('/', async (req, res) => {
  try {
    const { userId, action, resource, startDate, endDate, page = 1, limit = 50 } = req.query;
    
    const filter = {};
    if (userId) filter.userId = userId;
    if (action) filter.action = new RegExp(action, 'i');
    if (resource) filter.resource = new RegExp(resource, 'i');
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const activities = await ActivityLog.find(filter)
      .populate('userId', 'username email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(isNaN(parseInt(limit)) ? 50 : parseInt(limit));

    const total = await ActivityLog.countDocuments(filter);

    res.json({
      success: true,
      data: activities,
      pagination: { 
        page: isNaN(parseInt(page)) ? 1 : parseInt(page), 
        limit: isNaN(parseInt(limit)) ? 50 : parseInt(limit), 
        total 
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching activity logs' });
  }
});

// Get activity stats
router.get('/stats', async (req, res) => {
  try {
    const stats = await ActivityLog.aggregate([
      {
        $group: {
          _id: { action: '$action', resource: '$resource' },
          count: { $sum: 1 },
          users: { $addToSet: '$username' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching stats' });
  }
});

module.exports = router;