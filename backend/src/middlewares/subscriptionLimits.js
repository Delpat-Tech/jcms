const { getActiveSubscription } = require('../controllers/subscriptionController');

const checkUploadLimit = async (req, res, next) => {
  try {
    const subscription = await getActiveSubscription(req.user.id);
    const plan = subscription?.plan || 'free';
    
    // Set file size limits based on plan
    const limits = {
      free: 10 * 1024 * 1024,      // 10MB
      standard: 100 * 1024 * 1024,  // 100MB
      premium: 100 * 1024 * 1024    // 100MB
    };
    
    req.uploadLimit = limits[plan] || limits.free;
    
    // Check file size if file exists
    if (req.file && req.file.size > req.uploadLimit) {
      return res.status(400).json({
        success: false,
        message: `File size exceeds limit. Max: ${req.uploadLimit / (1024 * 1024)}MB for ${plan} plan`
      });
    }
    
    // Check multiple files
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        if (file.size > req.uploadLimit) {
          return res.status(400).json({
            success: false,
            message: `File "${file.originalname}" exceeds limit. Max: ${req.uploadLimit / (1024 * 1024)}MB for ${plan} plan`
          });
        }
      }
    }
    
    req.userPlan = plan;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { checkUploadLimit };
