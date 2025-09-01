// middlewares/validateTenant.js
const mongoose = require('mongoose');

const validateTenant = (req, res, next) => {
  // Ensure user is authenticated
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  // Validate tenant exists
  if (!req.user.tenant) {
    return res.status(403).json({ success: false, message: 'No tenant associated with user' });
  }

  // Validate tenant ID format
  if (!mongoose.Types.ObjectId.isValid(req.user.tenant)) {
    return res.status(400).json({ success: false, message: 'Invalid tenant ID format' });
  }

  next();
};

module.exports = validateTenant;