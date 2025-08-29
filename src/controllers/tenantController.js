// controllers/tenantController.js
const Tenant = require('../models/tenant');

const createTenant = async (req, res) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ success: false, message: 'Request body is required' });
    }
    
    const { name, subdomain } = req.body;
    
    if (!name || !subdomain) {
      return res.status(400).json({ success: false, message: 'Name and subdomain are required' });
    }
    
    const tenant = await Tenant.create({ name, subdomain });
    res.status(201).json({ success: true, data: tenant });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating tenant', error: error.message });
  }
};

const getTenants = async (req, res) => {
  try {
    const tenants = await Tenant.find();
    res.status(200).json({ success: true, data: tenants });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching tenants', error: error.message });
  }
};

module.exports = { createTenant, getTenants };