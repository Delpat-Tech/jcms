// src/routes/superadminRoutes.js
const express = require('express');
const { backupDatabase } = require('../utils/backup');
const { authenticate, requireSuperAdmin } = require('../middlewares/auth');
const Role = require('../models/role');
const Settings = require('../models/settings');
const User = require('../models/user');
const Image = require('../models/image');
const File = require('../models/file');
const Tenant = require('../models/tenant');
const ActivityLog = require('../models/activityLog');
const router = express.Router();

// All routes require authentication and superadmin role
router.use((req, res, next) => {
  console.log('Superadmin route accessed:', req.path);
  console.log('User from token:', req.user);
  next();
}, authenticate, requireSuperAdmin);

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Superadmin routes working' });
});

// Dashboard endpoint
router.get('/dashboard', async (req, res) => {
  try {
    const now = new Date();
    const last24Hours = new Date(now - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now - 30 * 24 * 60 * 60 * 1000);

    // Parallel execution for better performance
    const [
      totalUsers,
      totalTenants,
      totalImages,
      totalFiles,
      activeUsersToday,
      newUsersThisWeek,
      recentActivity,
      systemStats,
      usersByRole,
      tenantsByStatus,
      uploadTrends,
      storageStats
    ] = await Promise.all([
      User.countDocuments(),
      Tenant.countDocuments(),
      Image.countDocuments(),
      File.countDocuments(),
      ActivityLog.distinct('userId', { createdAt: { $gte: last24Hours } }).then(users => users.length),
      User.countDocuments({ createdAt: { $gte: last7Days } }),
      ActivityLog.find().sort({ createdAt: -1 }).limit(10).populate('userId', 'username'),
      {
        uptime: Math.floor(process.uptime()),
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
        }
      },
      User.aggregate([
        { $lookup: { from: 'roles', localField: 'role', foreignField: '_id', as: 'roleData' } },
        { $unwind: '$roleData' },
        { $group: { _id: '$roleData.name', count: { $sum: 1 } } }
      ]),
      Tenant.aggregate([
        { $group: { _id: '$isActive', count: { $sum: 1 } } }
      ]),
      Image.aggregate([
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: -1 } },
        { $limit: 7 }
      ]),
      {
        totalStorage: await Image.aggregate([
          { $group: { _id: null, total: { $sum: '$fileSize' } } }
        ]).then(result => result[0]?.total || 0),
        avgFileSize: await Image.aggregate([
          { $group: { _id: null, avg: { $avg: '$fileSize' } } }
        ]).then(result => result[0]?.avg || 0)
      }
    ]);

    // Format the response
    const dashboardData = {
      overview: {
        totalUsers,
        totalTenants,
        totalImages,
        totalFiles,
        activeUsersToday,
        newUsersThisWeek
      },
      system: {
        uptime: systemStats.uptime,
        memory: systemStats.memory,
        timestamp: now
      },
      analytics: {
        usersByRole: usersByRole.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        tenantsByStatus: tenantsByStatus.reduce((acc, item) => {
          acc[item._id ? 'active' : 'inactive'] = item.count;
          return acc;
        }, {}),
        uploadTrends: uploadTrends.reverse(),
        storage: {
          total: Math.round(storageStats.totalStorage / 1024 / 1024), // MB
          avgFileSize: Math.round(storageStats.avgFileSize / 1024) // KB
        }
      },
      recentActivity: recentActivity.map(activity => ({
        id: activity._id,
        user: activity.userId?.username || 'Unknown',
        action: activity.action,
        target: activity.target,
        timestamp: activity.createdAt
      }))
    };

    res.json({ success: true, data: dashboardData });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// System stats endpoint
router.get('/stats', async (req, res) => {
  try {
    const [totalUsers, totalTenants, totalImages, systemHealth] = await Promise.all([
      User.countDocuments(),
      Tenant.countDocuments(),
      Image.countDocuments(),
      {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodeVersion: process.version
      }
    ]);

    res.json({
      success: true,
      stats: {
        users: totalUsers,
        tenants: totalTenants,
        images: totalImages,
        system: systemHealth
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Roles management
router.get('/roles', async (req, res) => {
  try {
    const roles = await Role.find().sort({ createdAt: -1 });
    res.json({ success: true, roles });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/roles', async (req, res) => {
  try {
    const role = new Role(req.body);
    await role.save();
    res.json({ success: true, role });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.put('/roles/:id', async (req, res) => {
  try {
    const role = await Role.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!role) return res.status(404).json({ success: false, message: 'Role not found' });
    res.json({ success: true, role });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.delete('/roles/:id', async (req, res) => {
  try {
    const role = await Role.findByIdAndDelete(req.params.id);
    if (!role) return res.status(404).json({ success: false, message: 'Role not found' });
    res.json({ success: true, message: 'Role deleted' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Settings management
router.get('/settings', async (req, res) => {
  console.log('Settings GET route hit');
  try {
    // Create default settings if none exist
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
      await settings.save();
    }
    console.log('Settings retrieved:', settings);
    res.json({ success: true, settings });
  } catch (error) {
    console.error('Settings GET error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/settings', async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings(req.body);
    } else {
      Object.assign(settings, req.body);
    }
    await settings.save();
    res.json({ success: true, settings });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

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