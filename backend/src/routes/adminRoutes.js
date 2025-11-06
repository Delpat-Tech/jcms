const express = require('express');
const { authenticate, requireAdminOrAbove, addTenantFilter } = require('../middlewares/auth');
const User = require('../models/user');
const Image = require('../models/image');
const File = require('../models/file');
const ActivityLog = require('../models/activityLog');

const router = express.Router();

router.use(authenticate, requireAdminOrAbove, addTenantFilter);

router.get('/dashboard', async (req, res) => {
  try {
    const tenantFilter = req.tenantFilter || {};
    
    const [users, images, files, activities, usersByRole] = await Promise.all([
      User.find(tenantFilter),
      Image.find(tenantFilter),
      File.find(tenantFilter),
      ActivityLog.find(tenantFilter).sort({ createdAt: -1 }).limit(10).populate('user', 'username'),
      User.aggregate([
        ...(tenantFilter.tenant ? [{ $match: { tenant: tenantFilter.tenant } }] : []),
        { $group: { _id: '$role', count: { $sum: 1 } } }
      ])
    ]);

    const totalStorage = images.reduce((sum, img) => sum + (img.fileSize || 0), 0) + 
                        files.reduce((sum, file) => sum + (file.fileSize || 0), 0);

    const overview = {
      totalUsers: users.length,
      activeUsers: users.filter(u => u.status === 'active').length,
      totalImages: images.length,
      totalFiles: files.length,
      totalStorage: Math.round(totalStorage / (1024 * 1024)),
      totalCollections: 0,
      publicCollections: 0
    };

    const roleMap = {};
    usersByRole.forEach(r => { roleMap[r._id] = r.count; });

    res.json({
      success: true,
      data: {
        overview,
        usersByRole: roleMap,
        recentActivity: activities
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
