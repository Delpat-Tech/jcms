// routes/editorRoutes.js
const express = require('express');
const { authenticate, requireEditorOrAbove } = require('../middlewares/auth');
const Content = require('../models/content');
const Image = require('../models/image');
const File = require('../models/file');
const ActivityLog = require('../models/activityLog');

const router = express.Router();

// All routes require authentication and editor role or above
router.use(authenticate, requireEditorOrAbove);

// Editor dashboard statistics
router.get('/dashboard', async (req, res) => {
  try {
    const userId = req.user.id;
    const tenantId = req.user.tenant;
    
    // Get user-specific content statistics
    const contentStats = await Content.aggregate([
      { $match: { author: userId, deleted: { $ne: true } } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalViews: { $sum: '$views' }
        }
      }
    ]);
    
    // Get total content count
    const totalContent = await Content.countDocuments({ 
      author: userId, 
      deleted: { $ne: true } 
    });
    
    // Get media statistics
    const [imageCount, fileCount] = await Promise.all([
      Image.countDocuments({ userId, deleted: { $ne: true } }),
      File.countDocuments({ userId, deleted: { $ne: true } })
    ]);
    
    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentActivity = await ActivityLog.find({
      userId,
      createdAt: { $gte: sevenDaysAgo }
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .select('action resource resourceId createdAt');
    
    // Transform content statistics
    const stats = {
      drafts: 0,
      published: 0,
      scheduled: 0,
      totalViews: 0
    };
    
    contentStats.forEach(stat => {
      stats[stat._id] = stat.count;
      stats.totalViews += stat.totalViews || 0;
    });
    
    res.json({
      success: true,
      data: {
        contentStats: {
          ...stats,
          total: totalContent
        },
        mediaStats: {
          images: imageCount,
          files: fileCount,
          total: imageCount + fileCount
        },
        recentActivity,
        summary: {
          totalContent,
          totalMedia: imageCount + fileCount,
          totalViews: stats.totalViews,
          joinDate: req.user.createdAt || new Date()
        }
      }
    });
  } catch (error) {
    console.error('Editor dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load dashboard data',
      error: error.message
    });
  }
});

// Content statistics endpoint
router.get('/content-stats', async (req, res) => {
  try {
    const userId = req.user.id;
    
    const stats = await Content.aggregate([
      { $match: { author: userId, deleted: { $ne: true } } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalViews: { $sum: '$views' },
          recentContent: { 
            $push: {
              id: '$_id',
              title: '$title',
              createdAt: '$createdAt',
              updatedAt: '$updatedAt'
            }
          }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Content stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load content statistics',
      error: error.message
    });
  }
});

// Recent activity endpoint  
router.get('/recent-activity', async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 20;
    
    const activities = await ActivityLog.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('action resource resourceId createdAt metadata')
      .lean();
    
    res.json({
      success: true,
      data: activities
    });
  } catch (error) {
    console.error('Recent activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load recent activity',
      error: error.message
    });
  }
});

module.exports = router;