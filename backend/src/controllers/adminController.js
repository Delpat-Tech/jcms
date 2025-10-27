// controllers/adminController.js
const User = require('../models/user');
const Image = require('../models/image');
const File = require('../models/file');
const Content = require('../models/content');
const ImageCollection = require('../models/imageCollection');
const ActivityLog = require('../models/activityLog');
const Tenant = require('../models/tenant');

// Get admin dashboard data (tenant-scoped)
const getDashboard = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id).populate('role tenant');
    
    if (!currentUser || currentUser.role.name !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const tenantId = currentUser.tenant._id;

    // Get tenant users (excluding superadmin)
    const Role = require('../models/role');
    const superadminRole = await Role.findOne({ name: 'superadmin' });
    const users = await User.find({ 
      tenant: tenantId,
      role: { $ne: superadminRole?._id }
    }).populate('role', 'name');

    // Get tenant images
    const images = await Image.find({ tenant: tenantId });
    console.log(`Found ${images.length} images for tenant ${tenantId}`);

    // Get tenant files
    const files = await File.find({ tenant: tenantId });
    console.log(`Found ${files.length} files for tenant ${tenantId}`);

    // Get tenant content
    const content = await Content.find({ tenant: tenantId });

    // Get tenant collections
    const collections = await ImageCollection.find({ tenant: tenantId });
    console.log(`Found ${collections.length} collections for tenant ${tenantId}`);

    // Get recent activity for tenant users
    const tenantUserIds = users.map(u => u._id);
    const recentActivity = await ActivityLog.find({ 
      user: { $in: tenantUserIds }
    })
      .populate('user', 'username')
      .sort({ createdAt: -1 })
      .limit(10);
    
    console.log(`Found ${recentActivity.length} activity logs for tenant users`);

    // Calculate stats
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.isActive).length;
    const totalImages = images.length;
    const totalFiles = files.length;
    const totalContent = content.length;
    const publishedContent = content.filter(c => c.status === 'published').length;
    const totalCollections = collections.length;
    const publicCollections = collections.filter(c => c.visibility === 'public').length;

    // Calculate storage
    const imageSize = images.reduce((acc, img) => acc + (img.fileSize || 0), 0);
    const fileSize = files.reduce((acc, file) => acc + (file.fileSize || 0), 0);
    const totalStorage = Math.round((imageSize + fileSize) / (1024 * 1024)); // MB

    // User distribution by role
    const usersByRole = users.reduce((acc, user) => {
      const role = user.role.name;
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {});

    // Content by status
    const contentByStatus = content.reduce((acc, item) => {
      const status = item.status;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    console.log('Dashboard stats:', {
      totalUsers,
      totalImages,
      totalFiles,
      totalContent,
      totalStorage
    });

    const dashboardData = {
      overview: {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        totalImages,
        totalFiles,
        totalContent,
        publishedContent,
        draftContent: totalContent - publishedContent,
        totalCollections,
        publicCollections,
        privateCollections: totalCollections - publicCollections,
        totalStorage
      },
      analytics: {
        usersByRole,
        contentByStatus,
        storage: {
          images: Math.round(imageSize / (1024 * 1024)),
          files: Math.round(fileSize / (1024 * 1024)),
          total: totalStorage
        }
      },
      recentActivity: recentActivity.map(activity => ({
        id: activity._id,
        username: activity.user?.username || 'Unknown',
        action: activity.action,
        resource: activity.resource,
        resourceId: activity.resourceId,
        createdAt: activity.createdAt
      })),
      tenant: {
        id: currentUser.tenant._id,
        name: currentUser.tenant.name,
        subdomain: currentUser.tenant.subdomain
      }
    };

    res.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: error.message
    });
  }
};

// Get admin stats (simplified version)
const getStats = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id).populate('role tenant');
    
    if (!currentUser || currentUser.role.name !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const tenantId = currentUser.tenant._id;

    // Quick stats
    const [userCount, imageCount, fileCount, contentCount] = await Promise.all([
      User.countDocuments({ tenant: tenantId }),
      Image.countDocuments({ tenant: tenantId }),
      File.countDocuments({ tenant: tenantId }),
      Content.countDocuments({ tenant: tenantId })
    ]);

    res.json({
      success: true,
      stats: {
        users: userCount,
        images: imageCount,
        files: fileCount,
        content: contentCount
      }
    });

  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stats',
      error: error.message
    });
  }
};

module.exports = {
  getDashboard,
  getStats
};