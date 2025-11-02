const fileCleanupJob = require('../jobs/fileCleanupJob');
const fileCleanupService = require('../services/fileCleanupService');

/**
 * Get cleanup job status
 */
const getCleanupStatus = async (req, res) => {
  try {
    const status = fileCleanupJob.getStatus();
    const expiringSoon = await fileCleanupService.getFilesExpiringSoon(3);
    
    res.json({
      success: true,
      data: {
        ...status,
        expiringSoon: {
          images: expiringSoon.images.length,
          files: expiringSoon.files.length,
          total: expiringSoon.images.length + expiringSoon.files.length
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get cleanup status',
      error: error.message
    });
  }
};

/**
 * Run cleanup job manually (admin only)
 */
const runCleanupManual = async (req, res) => {
  try {
    // Only superadmin can run manual cleanup
    if (req.user.role.name !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Only superadmin can run manual cleanup'
      });
    }

    const results = await fileCleanupJob.runManual();
    
    res.json({
      success: true,
      message: 'Manual cleanup completed',
      data: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get files expiring soon
 */
const getExpiringFiles = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const expiringSoon = await fileCleanupService.getFilesExpiringSoon(days);
    
    res.json({
      success: true,
      data: expiringSoon
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get expiring files',
      error: error.message
    });
  }
};

module.exports = {
  getCleanupStatus,
  runCleanupManual,
  getExpiringFiles
};