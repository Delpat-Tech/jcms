// routes/tenantAnalyticsRoutes.js
const express = require('express');
const mongoose = require('mongoose');
const { 
  getTenantDashboard,
  getTenantUsageHistory,
  getTenantPerformanceMetrics,
  getTenantActivityReport,
  compareTenants
} = require('../controllers/tenantAnalyticsController');
const { authenticate, requireAdminOrAbove, requireSuperAdmin } = require('../middlewares/auth');
const { enforceTenantIsolation, logTenantAccess } = require('../middlewares/tenantMiddleware');

const router = express.Router();

// Apply authentication and tenant isolation to all routes
router.use(authenticate);
router.use(enforceTenantIsolation());

// Tenant analytics routes (admin or above can access their tenant's analytics)
router.get('/:tenantId/dashboard', 
  requireAdminOrAbove, 
  logTenantAccess('analytics'),
  getTenantDashboard
);

router.get('/:tenantId/usage-history', 
  requireAdminOrAbove, 
  logTenantAccess('analytics'),
  getTenantUsageHistory
);

router.get('/:tenantId/performance', 
  requireAdminOrAbove, 
  logTenantAccess('analytics'),
  getTenantPerformanceMetrics
);

router.get('/:tenantId/activity-report', 
  requireAdminOrAbove, 
  logTenantAccess('analytics'),
  getTenantActivityReport
);

// Superadmin only - compare multiple tenants
router.get('/compare', 
  requireSuperAdmin, 
  logTenantAccess('tenant-comparison'),
  compareTenants
);

// Simple tenant analytics endpoint
router.get('/:tenantId', async (req, res) => {
  try {
    const User = require('../models/user');
    const Image = require('../models/image');
    const File = require('../models/file');
    const ActivityLog = require('../models/activityLog');
    
    // For now, show all data to debug
    const [users, images, files, activities] = await Promise.all([
      User.countDocuments({}),
      Image.countDocuments({}),
      File.countDocuments({}),
      ActivityLog.find({}).sort({ createdAt: -1 }).limit(10).populate('userId', 'username')
    ]);
    
    const totalActivities = await ActivityLog.countDocuments({});
    const todayActivities = await ActivityLog.countDocuments({ 
      createdAt: { $gte: new Date(new Date().setHours(0,0,0,0)) }
    });
    
    const analytics = {
      users: { total: users, active: users },
      images: { total: images, totalSize: Math.round(images * 0.5) },
      files: { total: files, totalSize: Math.round(files * 0.3) },
      activities: { total: totalActivities, today: todayActivities },
      recentActivities: await Promise.all(activities.map(async (a) => {
        let imageUrl = null;
        if (a.action === 'image_upload' && a.resourceId) {
          try {
            const Image = require('../models/image');
            const fs = require('fs');
            const path = require('path');
            
            const image = await Image.findById(a.resourceId);
            console.log('Found image for resourceId', a.resourceId, ':', image ? { fileUrl: image.fileUrl, internalPath: image.internalPath } : 'null');
            
            if (image) {
              // Try the internalPath first (this is what's actually stored)
              if (image.internalPath) {
                const internalFilePath = path.join(__dirname, '..', '..', image.internalPath);
                console.log('Checking internalPath:', internalFilePath, 'exists:', fs.existsSync(internalFilePath));
                if (fs.existsSync(internalFilePath)) {
                  // Ensure forward slashes for URL
                  const urlPath = image.internalPath.replace(/\\/g, '/');
                  imageUrl = `http://localhost:5000/${urlPath}`;
                }
              }
              
              // Try the stored fileUrl as fallback
              if (!imageUrl && image.fileUrl) {
                const fullUrl = image.fileUrl.startsWith('http') ? image.fileUrl : `http://localhost:5000${image.fileUrl}`;
                const filePath = path.join(__dirname, '..', '..', image.fileUrl.replace('/uploads/', 'uploads/'));
                console.log('Checking fileUrl:', filePath, 'exists:', fs.existsSync(filePath));
                if (fs.existsSync(filePath)) {
                  imageUrl = fullUrl;
                }
              }
            }
            console.log('Final imageUrl for resourceId', a.resourceId, ':', imageUrl);
          } catch (error) {
            console.log('Error getting image URL for resourceId', a.resourceId, ':', error.message);
          }
        }
        const result = {
          action: a.action || 'Unknown Action',
          username: a.userId?.username || 'Unknown User',
          timestamp: a.createdAt || new Date(),
          imageUrl,
          resourceId: a.resourceId
        };
        console.log('Activity result:', result);
        return result;
      }))
    };
    
    res.json({ success: true, analytics });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Debug endpoint to check actual data
router.get('/debug/:tenantId', async (req, res) => {
  try {
    const User = require('../models/user');
    const Image = require('../models/image');
    const File = require('../models/file');
    const ActivityLog = require('../models/activityLog');
    
    const tenantId = req.params.tenantId;
    
    const [allUsers, allImages, allFiles, allActivities] = await Promise.all([
      User.find({}).select('tenant username'),
      Image.find({}).select('tenant title internalPath fileUrl').sort({ createdAt: -1 }).limit(5),
      File.find({}).select('tenant filename'),
      ActivityLog.find({ action: 'image_upload' }).select('resourceId action createdAt').sort({ createdAt: -1 }).limit(5)
    ]);
    
    res.json({ 
      success: true,
      tenantId,
      debug: {
        allUsers: allUsers.length,
        allImages: allImages.length,
        allFiles: allFiles.length,
        allActivities: allActivities.length,
        sampleUsers: allUsers.slice(0, 3),
        recentImages: allImages,
        sampleFiles: allFiles.slice(0, 3),
        recentImageActivities: allActivities
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Test route for analytics
router.get('/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Tenant analytics routes working',
    user: {
      id: req.user.id,
      role: req.user.role.name,
      tenant: req.user.tenant?.name || 'none'
    }
  });
});

// Quick test endpoint to check image paths
router.get('/test-images', async (req, res) => {
  try {
    const Image = require('../models/image');
    const fs = require('fs');
    const path = require('path');
    
    const images = await Image.find({}).sort({ createdAt: -1 }).limit(3);
    const results = images.map(img => {
      const internalExists = fs.existsSync(path.join(__dirname, '..', '..', img.internalPath));
      const fileUrlPath = img.fileUrl.replace('http://localhost:5000/', '');
      const fileUrlExists = fs.existsSync(path.join(__dirname, '..', '..', fileUrlPath));
      
      return {
        id: img._id,
        title: img.title,
        internalPath: img.internalPath,
        fileUrl: img.fileUrl,
        internalExists,
        fileUrlExists,
        suggestedUrl: internalExists ? `http://localhost:5000/${img.internalPath}` : null
      };
    });
    
    res.json({ success: true, images: results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;