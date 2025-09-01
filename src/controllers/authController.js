// controllers/authController.js - All authentication operations
const User = require('../models/user');
const Tenant = require('../models/tenant');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const WebhookService = require('../services/webhookService');

const webhookService = new WebhookService();

// Register user
const registerUser = async (req, res) => {
  const { username, email, password, tenant } = req.body;
  try {
    let user = await User.findOne({ email, tenant });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }
    user = new User({ username, email, password, tenant, role: 'viewer' });
    await user.save();
    
    // Trigger n8n webhook for welcome email
    console.log('🔔 Attempting to trigger welcome email webhook...');
    try {
      const tenantData = await Tenant.findById(tenant);
      console.log('📧 Tenant data found:', tenantData?.name);
      
      const result = await webhookService.triggerUserRegistration({
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }, {
        id: tenantData._id,
        name: tenantData.name,
        subdomain: tenantData.subdomain
      });
      
      console.log('🎉 Webhook result:', result);
    } catch (webhookError) {
      console.log('❌ Webhook failed but user created:', webhookError.message);
    }
    
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Login user
const loginUser = async (req, res) => {
  const { email, password, tenant } = req.body;
  try {
    const user = await User.findOne({ email, tenant });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const payload = { id: user._id, role: user.role, tenant: user.tenant };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ token, role: user.role, tenant: user.tenant });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


module.exports = { registerUser, loginUser };