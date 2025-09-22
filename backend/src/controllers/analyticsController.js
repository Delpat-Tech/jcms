// controllers/analyticsController.js
const User = require('../models/user');
const Image = require('../models/image');
const File = require('../models/file');

const getDashboardStats = async (req, res) => {
  try {
    const tenantFilter = req.tenantFilter || {};
    const [
      totalUsers,
      totalFiles,
      recentImages,
      recentFiles,
      usersByRole,
      uploadsByDay
    ] = await Promise.all([
      User.countDocuments(tenantFilter),
      File.countDocuments(tenantFilter),
      Image.find(tenantFilter).sort({ createdAt: -1 }).limit(10).populate('user', 'username'),
      File.find(tenantFilter).sort({ createdAt: -1 }).limit(10).populate('user', 'username'),
      User.aggregate([
        { $lookup: { from: 'roles', localField: 'role', foreignField: '_id', as: 'role' } },
        { $unwind: '$role' },
        ...(tenantFilter.tenant ? [{ $match: { tenant: tenantFilter.tenant } }] : []),
        { $group: { _id: '$role.name', count: { $sum: 1 } } }
      ]),
      Image.aggregate([
        ...(tenantFilter.tenant ? [{ $match: { tenant: tenantFilter.tenant } }] : []),
        { $group: { 
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }},
        { $sort: { _id: -1 } },
        { $limit: 7 }
      ])
    ]);

    // Combine and sort recent uploads (images + files)
    const allUploads = [
      ...recentImages.map(img => ({ ...img.toObject(), type: 'image' })),
      ...recentFiles.map(file => ({ ...file.toObject(), type: 'file' }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalFiles,
        recentUploads: allUploads,
        usersByRole,
        uploadsByDay
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getUserActivity = async (req, res) => {
  try {
    const tenantFilter = req.tenantFilter || {};
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const [
      activeUsers,
      newUsers,
      userActivity
    ] = await Promise.all([
      Image.distinct('user', { createdAt: { $gte: startDate }, ...tenantFilter }),
      User.countDocuments({ createdAt: { $gte: startDate }, ...tenantFilter }),
      User.aggregate([
        ...(tenantFilter.tenant ? [{ $match: { tenant: tenantFilter.tenant } }] : []),
        { $lookup: { from: 'images', localField: '_id', foreignField: 'user', as: 'images' } },
        { $project: {
          username: 1,
          email: 1,
          imageCount: { $size: '$images' },
          totalUploads: { $size: '$images' }
        }},
        { $sort: { totalUploads: -1 } },
        { $limit: 10 }
      ])
    ]);

    res.json({
      success: true,
      data: {
        activeUsersCount: activeUsers.length,
        newUsersCount: newUsers,
        topActiveUsers: userActivity
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getSystemHealth = async (req, res) => {
  try {
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    
    res.json({
      success: true,
      data: {
        uptime: Math.floor(uptime),
        memory: {
          used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          total: Math.round(memoryUsage.heapTotal / 1024 / 1024)
        },
        timestamp: new Date()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getSecurityInsights = async (req, res) => {
  try {
    const tenantFilter = req.tenantFilter || {};
    const [failedLogins, suspiciousActivity, fileAccessPatterns] = await Promise.all([
      // Mock failed login attempts (you'd track these in a separate collection)
      Promise.resolve([{ ip: '192.168.1.100', attempts: 5, lastAttempt: new Date() }]),
      Image.aggregate([
        { $match: { createdAt: { $gte: new Date(Date.now() - 24*60*60*1000) }, ...tenantFilter } },
        { $group: { _id: '$user', uploads: { $sum: 1 } } },
        { $match: { uploads: { $gt: 50 } } } // Suspicious: >50 uploads/day
      ]),
      Image.aggregate([
        ...(tenantFilter.tenant ? [{ $match: { tenant: tenantFilter.tenant } }] : []),
        { $group: { _id: { hour: { $hour: '$createdAt' }, user: '$user' }, count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
    ]);

    res.json({ success: true, data: { failedLogins, suspiciousActivity, fileAccessPatterns } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getContentInsights = async (req, res) => {
  try {
    const tenantFilter = req.tenantFilter || {};
    const [duplicateFiles, largestFiles, formatTrends, conversionStats] = await Promise.all([
      Image.aggregate([
        ...(tenantFilter.tenant ? [{ $match: { tenant: tenantFilter.tenant } }] : []),
        { $group: { _id: { name: '$originalName', size: '$fileSize' }, count: { $sum: 1 }, files: { $push: '$_id' } } },
        { $match: { count: { $gt: 1 } } }
      ]),
      Image.find(tenantFilter).sort({ fileSize: -1 }).limit(10).populate('user', 'username'),
      Image.aggregate([
        ...(tenantFilter.tenant ? [{ $match: { tenant: tenantFilter.tenant } }] : []),
        { $group: { _id: { format: '$format', month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { '_id.month': -1 } }
      ]),
      // Mock conversion tracking (you'd implement this in conversion service)
      Promise.resolve({ totalConversions: 45, popularConversions: [{ from: 'pdf', to: 'txt', count: 20 }] })
    ]);

    res.json({ success: true, data: { duplicateFiles, largestFiles, formatTrends, conversionStats } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getPredictiveAnalytics = async (req, res) => {
  try {
    const tenantFilter = req.tenantFilter || {};
    const thirtyDaysAgo = new Date(Date.now() - 30*24*60*60*1000);
    const [growthRate, storageProjection, userEngagement] = await Promise.all([
      Image.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo }, ...tenantFilter } },
        { $group: { _id: { $dayOfMonth: '$createdAt' }, count: { $sum: 1 } } },
        { $sort: { '_id': 1 } }
      ]),
      Image.aggregate([
        ...(tenantFilter.tenant ? [{ $match: { tenant: tenantFilter.tenant } }] : []),
        { $group: { _id: null, avgSize: { $avg: '$fileSize' }, totalFiles: { $sum: 1 } } }
      ]),
      User.aggregate([
        ...(tenantFilter.tenant ? [{ $match: { tenant: tenantFilter.tenant } }] : []),
        { $lookup: { from: 'files', localField: '_id', foreignField: 'user', as: 'recentFiles', pipeline: [{ $match: { createdAt: { $gte: thirtyDaysAgo } } }] } },
        { $project: { username: 1, activityScore: { $size: '$recentFiles' } } },
        { $match: { activityScore: { $gt: 0 } } }
      ])
    ]);

    // Simple growth prediction
    const avgDailyUploads = growthRate.reduce((sum, day) => sum + day.count, 0) / growthRate.length;
    const projectedMonthlyGrowth = avgDailyUploads * 30;
    const avgFileSize = storageProjection[0]?.avgSize || 0;
    const projectedStorageNeed = projectedMonthlyGrowth * avgFileSize;

    res.json({ 
      success: true, 
      data: { 
        avgDailyUploads, 
        projectedMonthlyGrowth, 
        projectedStorageNeed: Math.round(projectedStorageNeed / 1024 / 1024), // MB
        activeUsersTrend: userEngagement.length
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getPerformanceMetrics = async (req, res) => {
  try {
    const [avgUploadTime, peakUsageHours, errorRates] = await Promise.all([
      // Mock upload time tracking (you'd implement this in upload middleware)
      Promise.resolve({ avgTime: 2.3, slowestUploads: [{ file: 'large.pdf', time: 15.2 }] }),
      Image.aggregate([
        { $group: { _id: { $hour: '$createdAt' }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]),
      // Mock error tracking
      Promise.resolve({ uploadErrors: 12, conversionErrors: 3, authErrors: 8 })
    ]);

    res.json({ success: true, data: { avgUploadTime, peakUsageHours, errorRates } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDashboardStats,
  getUserActivity,
  getSystemHealth,
  getSecurityInsights,
  getContentInsights,
  getPredictiveAnalytics,
  getPerformanceMetrics
};