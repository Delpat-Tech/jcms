// controllers/analyticsController.js
const User = require('../models/user');
const Image = require('../models/image');
const Tenant = require('../models/tenant');
const fs = require('fs');
const path = require('path');

const getServerAnalytics = async (req, res) => {
  try {
    const totalTenants = await Tenant.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalImages = await Image.countDocuments();
    
    // Get today's data
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const usersToday = await User.countDocuments({ createdAt: { $gte: today } });
    const imagesToday = await Image.countDocuments({ createdAt: { $gte: today } });
    
    // Calculate storage usage
    const uploadsPath = path.join(__dirname, '../../uploads');
    let totalStorage = 0;
    
    try {
      const calculateSize = (dirPath) => {
        let size = 0;
        if (fs.existsSync(dirPath)) {
          const files = fs.readdirSync(dirPath);
          files.forEach(file => {
            const filePath = path.join(dirPath, file);
            const stats = fs.statSync(filePath);
            if (stats.isDirectory()) {
              size += calculateSize(filePath);
            } else {
              size += stats.size;
            }
          });
        }
        return size;
      };
      
      totalStorage = calculateSize(uploadsPath);
    } catch (error) {
      totalStorage = 0;
    }
    
    const storageGB = (totalStorage / (1024 * 1024 * 1024)).toFixed(2);

    res.json({
      success: true,
      data: {
        server: {
          uptime: process.uptime(),
          memoryUsage: process.memoryUsage(),
          nodeVersion: process.version
        },
        totals: {
          tenants: totalTenants,
          users: totalUsers,
          images: totalImages,
          storageGB: parseFloat(storageGB)
        },
        today: {
          newUsers: usersToday,
          newImages: imagesToday
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching server analytics', error: error.message });
  }
};

const getTenantAnalytics = async (req, res) => {
  try {
    const tenants = await Tenant.find();
    const analytics = [];

    for (const tenant of tenants) {
      const userCount = await User.countDocuments({ tenant: tenant._id });
      const imageCount = await Image.countDocuments({ tenant: tenant._id });
      
      // Calculate tenant storage
      const tenantPath = path.join(__dirname, '../../uploads', tenant._id.toString());
      let tenantStorage = 0;
      
      try {
        if (fs.existsSync(tenantPath)) {
          const calculateSize = (dirPath) => {
            let size = 0;
            const files = fs.readdirSync(dirPath);
            files.forEach(file => {
              const filePath = path.join(dirPath, file);
              const stats = fs.statSync(filePath);
              if (stats.isDirectory()) {
                size += calculateSize(filePath);
              } else {
                size += stats.size;
              }
            });
            return size;
          };
          tenantStorage = calculateSize(tenantPath);
        }
      } catch (error) {
        tenantStorage = 0;
      }

      analytics.push({
        tenant: {
          id: tenant._id,
          name: tenant.name,
          subdomain: tenant.subdomain,
          isActive: tenant.isActive,
          createdAt: tenant.createdAt
        },
        metrics: {
          users: userCount,
          images: imageCount,
          storageMB: (tenantStorage / (1024 * 1024)).toFixed(2)
        }
      });
    }

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching tenant analytics', error: error.message });
  }
};

const getDashboard = async (req, res) => {
  try {
    const serverData = await getServerAnalytics(req, { json: () => {} });
    const tenantData = await getTenantAnalytics(req, { json: () => {} });
    
    // Get most active tenant
    const tenants = await Tenant.aggregate([
      {
        $lookup: {
          from: 'images',
          localField: '_id',
          foreignField: 'tenant',
          as: 'images'
        }
      },
      {
        $addFields: {
          imageCount: { $size: '$images' }
        }
      },
      {
        $sort: { imageCount: -1 }
      },
      {
        $limit: 1
      }
    ]);

    const mostActiveTenant = tenants[0] || null;

    const dashboardData = {
      summary: {
        totalTenants: await Tenant.countDocuments(),
        totalUsers: await User.countDocuments(),
        totalImages: await Image.countDocuments(),
        activeTenants: await Tenant.countDocuments({ isActive: true })
      },
      mostActiveTenant: mostActiveTenant ? {
        name: mostActiveTenant.name,
        subdomain: mostActiveTenant.subdomain,
        imageCount: mostActiveTenant.imageCount
      } : null,
      recentActivity: {
        newTenantsToday: await Tenant.countDocuments({ 
          createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
        }),
        newUsersToday: await User.countDocuments({ 
          createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
        }),
        newImagesToday: await Image.countDocuments({ 
          createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
        })
      }
    };

    // Emit real-time analytics update
    const realtime = req.app.get('realtime');
    if (realtime) {
      realtime.analyticsUpdate(dashboardData);
    }

    res.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching dashboard', error: error.message });
  }
};

module.exports = { getServerAnalytics, getTenantAnalytics, getDashboard };