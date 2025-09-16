// controllers/tenantAnalyticsController.js
const User = require('../models/user');
const Image = require('../models/image');
const File = require('../models/file');
const Tenant = require('../models/tenant');
const { getTenantQuotaUsage, getTenantStorageStats } = require('../utils/tenantStorage');
const mongoose = require('mongoose');

// Get comprehensive tenant dashboard analytics
const getTenantDashboard = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { timeframe = '7d' } = req.query; // 24h, 7d, 30d, 90d

    // Validate tenant access
    if (req.user.role.name !== 'superadmin' && req.user.tenant?._id?.toString() !== tenantId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    // Calculate date range
    const now = new Date();
    const timeframes = {
      '24h': 1,
      '7d': 7,
      '30d': 30,
      '90d': 90
    };
    const days = timeframes[timeframe] || 7;
    const startDate = new Date(now - days * 24 * 60 * 60 * 1000);

    // Basic counts
    const [totalUsers, activeUsers, totalImages, totalFiles] = await Promise.all([
      User.countDocuments({ tenant: tenantId }),
      User.countDocuments({ tenant: tenantId, isActive: true }),
      Image.countDocuments({ tenant: tenantId }),
      File.countDocuments({ tenant: tenantId })
    ]);

    // User statistics by role
    const usersByRole = await User.aggregate([
      { $match: { tenant: new mongoose.Types.ObjectId(tenantId) } },
      { $lookup: { from: 'roles', localField: 'role', foreignField: '_id', as: 'roleData' } },
      { $unwind: '$roleData' },
      { $group: { _id: '$roleData.name', count: { $sum: 1 }, active: { $sum: { $cond: ['$isActive', 1, 0] } } } }
    ]);

    // Recent activity (new users, uploads, etc.)
    const [newUsersCount, newImagesCount, newFilesCount] = await Promise.all([
      User.countDocuments({ tenant: tenantId, createdAt: { $gte: startDate } }),
      Image.countDocuments({ tenant: tenantId, createdAt: { $gte: startDate } }),
      File.countDocuments({ tenant: tenantId, createdAt: { $gte: startDate } })
    ]);

    // Storage analytics
    const storageStats = getTenantStorageStats(tenantId);
    const quotaUsage = getTenantQuotaUsage(tenantId, tenant.settings?.maxStorage || '10GB');

    // Top uploaders
    const topUploaders = await Image.aggregate([
      { $match: { tenant: new mongoose.Types.ObjectId(tenantId), createdAt: { $gte: startDate } } },
      { $group: { _id: '$user', uploads: { $sum: 1 }, totalSize: { $sum: '$fileSize' } } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'userData' } },
      { $unwind: '$userData' },
      { $project: { username: '$userData.username', uploads: 1, totalSize: 1 } },
      { $sort: { uploads: -1 } },
      { $limit: 5 }
    ]);

    // File type distribution
    const fileTypeDistribution = await File.aggregate([
      { $match: { tenant: new mongoose.Types.ObjectId(tenantId) } },
      { $group: { _id: '$fileType', count: { $sum: 1 }, totalSize: { $sum: '$fileSize' } } },
      { $sort: { count: -1 } }
    ]);

    // Daily activity over timeframe
    const dailyActivity = await Image.aggregate([
      { $match: { tenant: new mongoose.Types.ObjectId(tenantId), createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          uploads: { $sum: 1 },
          totalSize: { $sum: '$fileSize' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const dashboard = {
      tenant: {
        id: tenant._id,
        name: tenant.name,
        subdomain: tenant.subdomain,
        isActive: tenant.isActive,
        createdAt: tenant.createdAt
      },
      overview: {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        totalImages,
        totalFiles,
        totalResources: totalImages + totalFiles
      },
      activity: {
        timeframe,
        startDate,
        newUsers: newUsersCount,
        newImages: newImagesCount,
        newFiles: newFilesCount,
        dailyActivity
      },
      users: {
        byRole: usersByRole.reduce((acc, role) => {
          acc[role._id] = { total: role.count, active: role.active };
          return acc;
        }, {}),
        topUploaders
      },
      storage: {
        used: quotaUsage.used,
        max: quotaUsage.max,
        available: quotaUsage.available,
        usagePercentage: quotaUsage.usagePercentage,
        isOverQuota: quotaUsage.isOverQuota,
        fileCount: quotaUsage.fileCount,
        breakdown: storageStats
      },
      content: {
        fileTypeDistribution
      }
    };

    res.json({ success: true, dashboard });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get tenant usage over time
const getTenantUsageHistory = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { period = 'daily', limit = 30 } = req.query; // daily, weekly, monthly

    // Validate tenant access
    if (req.user.role.name !== 'superadmin' && req.user.tenant?._id?.toString() !== tenantId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    let dateGroupFormat;
    let periodDays;

    switch (period) {
      case 'hourly':
        dateGroupFormat = '%Y-%m-%d %H:00';
        periodDays = 1;
        break;
      case 'weekly':
        dateGroupFormat = '%Y-%U';
        periodDays = 7 * limit;
        break;
      case 'monthly':
        dateGroupFormat = '%Y-%m';
        periodDays = 30 * limit;
        break;
      default: // daily
        dateGroupFormat = '%Y-%m-%d';
        periodDays = limit;
    }

    const startDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);

    // Get usage history
    const [imageHistory, fileHistory, userHistory] = await Promise.all([
      Image.aggregate([
        { $match: { tenant: new mongoose.Types.ObjectId(tenantId), createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: { $dateToString: { format: dateGroupFormat, date: '$createdAt' } },
            count: { $sum: 1 },
            totalSize: { $sum: '$fileSize' }
          }
        },
        { $sort: { _id: 1 } },
        { $limit: limit }
      ]),
      File.aggregate([
        { $match: { tenant: new mongoose.Types.ObjectId(tenantId), createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: { $dateToString: { format: dateGroupFormat, date: '$createdAt' } },
            count: { $sum: 1 },
            totalSize: { $sum: '$fileSize' }
          }
        },
        { $sort: { _id: 1 } },
        { $limit: limit }
      ]),
      User.aggregate([
        { $match: { tenant: new mongoose.Types.ObjectId(tenantId), createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: { $dateToString: { format: dateGroupFormat, date: '$createdAt' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } },
        { $limit: limit }
      ])
    ]);

    res.json({
      success: true,
      period,
      limit,
      startDate,
      history: {
        images: imageHistory,
        files: fileHistory,
        users: userHistory
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get tenant performance metrics
const getTenantPerformanceMetrics = async (req, res) => {
  try {
    const { tenantId } = req.params;

    // Validate tenant access
    if (req.user.role.name !== 'superadmin' && req.user.tenant?._id?.toString() !== tenantId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    // Calculate various performance metrics
    const now = new Date();
    const last30Days = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const last7Days = new Date(now - 7 * 24 * 60 * 60 * 1000);

    // User engagement metrics
    const [totalUsers, activeUsersLast30Days, activeUsersLast7Days, userGrowthLast30Days] = await Promise.all([
      User.countDocuments({ tenant: tenantId, isActive: true }),
      User.countDocuments({ 
        tenant: tenantId, 
        isActive: true,
        $or: [
          { lastLoginAt: { $gte: last30Days } },
          { createdAt: { $gte: last30Days } }
        ]
      }),
      User.countDocuments({ 
        tenant: tenantId, 
        isActive: true,
        $or: [
          { lastLoginAt: { $gte: last7Days } },
          { createdAt: { $gte: last7Days } }
        ]
      }),
      User.countDocuments({ tenant: tenantId, createdAt: { $gte: last30Days } })
    ]);

    // Content creation metrics
    const [imagesLast30Days, imagesLast7Days, filesLast30Days, filesLast7Days] = await Promise.all([
      Image.countDocuments({ tenant: tenantId, createdAt: { $gte: last30Days } }),
      Image.countDocuments({ tenant: tenantId, createdAt: { $gte: last7Days } }),
      File.countDocuments({ tenant: tenantId, createdAt: { $gte: last30Days } }),
      File.countDocuments({ tenant: tenantId, createdAt: { $gte: last7Days } })
    ]);

    // Storage growth
    const storageStats = getTenantStorageStats(tenantId);
    const quotaUsage = getTenantQuotaUsage(tenantId, tenant.settings?.maxStorage || '10GB');

    // Average file sizes
    const [avgImageSize, avgFileSize] = await Promise.all([
      Image.aggregate([
        { $match: { tenant: new mongoose.Types.ObjectId(tenantId) } },
        { $group: { _id: null, avgSize: { $avg: '$fileSize' } } }
      ]),
      File.aggregate([
        { $match: { tenant: new mongoose.Types.ObjectId(tenantId) } },
        { $group: { _id: null, avgSize: { $avg: '$fileSize' } } }
      ])
    ]);

    const metrics = {
      users: {
        total: totalUsers,
        engagement: {
          activeLastMonth: activeUsersLast30Days,
          activeLastWeek: activeUsersLast7Days,
          engagementRateMonth: totalUsers ? (activeUsersLast30Days / totalUsers * 100).toFixed(1) : 0,
          engagementRateWeek: totalUsers ? (activeUsersLast7Days / totalUsers * 100).toFixed(1) : 0
        },
        growth: {
          newUsersLast30Days: userGrowthLast30Days,
          growthRate: totalUsers ? (userGrowthLast30Days / (totalUsers - userGrowthLast30Days) * 100).toFixed(1) : 0
        }
      },
      content: {
        creation: {
          imagesLastMonth: imagesLast30Days,
          imagesLastWeek: imagesLast7Days,
          filesLastMonth: filesLast30Days,
          filesLastWeek: filesLast7Days,
          totalLastMonth: imagesLast30Days + filesLast30Days,
          totalLastWeek: imagesLast7Days + filesLast7Days
        },
        productivity: {
          avgImagesPerUserPerMonth: totalUsers ? (imagesLast30Days / totalUsers).toFixed(1) : 0,
          avgFilesPerUserPerMonth: totalUsers ? (filesLast30Days / totalUsers).toFixed(1) : 0
        }
      },
      storage: {
        current: quotaUsage,
        efficiency: {
          avgImageSize: avgImageSize[0]?.avgSize || 0,
          avgFileSize: avgFileSize[0]?.avgSize || 0,
          storagePerUser: totalUsers ? (quotaUsage.used / totalUsers).toFixed(0) : 0
        }
      },
      health: {
        quotaUtilization: quotaUsage.usagePercentage,
        isNearQuota: quotaUsage.usagePercentage > 80,
        isOverQuota: quotaUsage.isOverQuota,
        userCapacityUtilization: ((totalUsers / (tenant.settings?.maxUsers || 50)) * 100).toFixed(1)
      }
    };

    res.json({ success: true, metrics });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get tenant activity report
const getTenantActivityReport = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { 
      startDate, 
      endDate, 
      includeUsers = true, 
      includeImages = true, 
      includeFiles = true,
      format = 'json' 
    } = req.query;

    // Validate tenant access
    if (req.user.role.name !== 'superadmin' && req.user.tenant?._id?.toString() !== tenantId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    // Set default date range if not provided
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const report = {
      tenant: {
        id: tenant._id,
        name: tenant.name,
        subdomain: tenant.subdomain
      },
      reportPeriod: {
        startDate: start,
        endDate: end,
        durationDays: Math.ceil((end - start) / (1000 * 60 * 60 * 24))
      }
    };

    // User activity
    if (includeUsers === 'true') {
      const userActivity = await User.aggregate([
        { 
          $match: { 
            tenant: new mongoose.Types.ObjectId(tenantId),
            createdAt: { $gte: start, $lte: end }
          } 
        },
        { $lookup: { from: 'roles', localField: 'role', foreignField: '_id', as: 'roleData' } },
        { $unwind: '$roleData' },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            newUsers: { $sum: 1 },
            byRole: { 
              $push: { 
                role: '$roleData.name',
                username: '$username',
                email: '$email',
                createdAt: '$createdAt'
              } 
            }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      report.userActivity = userActivity;
    }

    // Image activity
    if (includeImages === 'true') {
      const imageActivity = await Image.aggregate([
        { 
          $match: { 
            tenant: new mongoose.Types.ObjectId(tenantId),
            createdAt: { $gte: start, $lte: end }
          } 
        },
        { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'userData' } },
        { $unwind: '$userData' },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            totalImages: { $sum: 1 },
            totalSize: { $sum: '$fileSize' },
            images: { 
              $push: { 
                title: '$title',
                format: '$format',
                fileSize: '$fileSize',
                username: '$userData.username',
                createdAt: '$createdAt'
              } 
            }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      report.imageActivity = imageActivity;
    }

    // File activity
    if (includeFiles === 'true') {
      const fileActivity = await File.aggregate([
        { 
          $match: { 
            tenant: new mongoose.Types.ObjectId(tenantId),
            createdAt: { $gte: start, $lte: end }
          } 
        },
        { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'userData' } },
        { $unwind: '$userData' },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            totalFiles: { $sum: 1 },
            totalSize: { $sum: '$fileSize' },
            files: { 
              $push: { 
                title: '$title',
                fileType: '$fileType',
                format: '$format',
                fileSize: '$fileSize',
                username: '$userData.username',
                createdAt: '$createdAt'
              } 
            }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      report.fileActivity = fileActivity;
    }

    if (format === 'csv') {
      // Convert to CSV format
      let csvContent = `Tenant Activity Report - ${tenant.name}\n`;
      csvContent += `Report Period: ${start.toISOString().split('T')[0]} to ${end.toISOString().split('T')[0]}\n\n`;
      
      // Add CSV data here based on requirements
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="tenant-${tenantId}-activity-report.csv"`);
      res.send(csvContent);
    } else {
      res.json({ success: true, report });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Compare multiple tenants (superadmin only)
const compareTenants = async (req, res) => {
  try {
    if (req.user.role.name !== 'superadmin') {
      return res.status(403).json({ success: false, message: 'Superadmin access required' });
    }

    const { tenantIds, metrics = ['users', 'storage', 'activity'] } = req.query;
    const tenantIdArray = tenantIds ? tenantIds.split(',') : [];

    if (tenantIdArray.length === 0) {
      // Compare all tenants
      const allTenants = await Tenant.find({ isActive: true }).select('_id name subdomain');
      tenantIdArray.push(...allTenants.map(t => t._id.toString()));
    }

    const comparison = [];

    for (const tenantId of tenantIdArray) {
      const tenant = await Tenant.findById(tenantId);
      if (!tenant) continue;

      const tenantData = {
        tenant: {
          id: tenant._id,
          name: tenant.name,
          subdomain: tenant.subdomain,
          createdAt: tenant.createdAt
        }
      };

      if (metrics.includes('users')) {
        const [totalUsers, activeUsers] = await Promise.all([
          User.countDocuments({ tenant: tenantId }),
          User.countDocuments({ tenant: tenantId, isActive: true })
        ]);
        tenantData.users = { total: totalUsers, active: activeUsers };
      }

      if (metrics.includes('storage')) {
        const quotaUsage = getTenantQuotaUsage(tenantId, tenant.settings?.maxStorage);
        tenantData.storage = quotaUsage;
      }

      if (metrics.includes('activity')) {
        const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const [newImages, newFiles] = await Promise.all([
          Image.countDocuments({ tenant: tenantId, createdAt: { $gte: last30Days } }),
          File.countDocuments({ tenant: tenantId, createdAt: { $gte: last30Days } })
        ]);
        tenantData.activity = { newImages, newFiles, total: newImages + newFiles };
      }

      comparison.push(tenantData);
    }

    res.json({ success: true, comparison });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getTenantDashboard,
  getTenantUsageHistory,
  getTenantPerformanceMetrics,
  getTenantActivityReport,
  compareTenants
};