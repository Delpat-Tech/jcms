// middlewares/tenant.js
const Tenant = require('../models/tenant');

const extractTenant = async (req, res, next) => {
  try {
    // Extract subdomain from request
    const host = req.get('host') || '';
    const subdomain = host.split('.')[0];
    
    // Find tenant by subdomain
    const tenant = await Tenant.findOne({ subdomain, isActive: true });
    
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }
    
    req.tenant = tenant;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Tenant resolution failed' });
  }
};

module.exports = extractTenant;