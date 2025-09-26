// controllers/authController.js
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logger = require('../config/logger');

const registerUser = async (req, res) => {
  return res.status(403).json({ 
    success: false,
    message: 'Public registration is disabled. Contact an administrator to create your account.' 
  });
};

const loginUser = async (req, res) => {
  const { username, email, password, rememberMe } = req.body;
  
  try {
    const loginField = username || email;
    if (!loginField || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username/email and password are required' 
      });
    }

    // Try to find user by username or email
    const user = await User.findOne({ 
      $or: [
        { username: loginField },
        { email: loginField }
      ]
    }).populate('role');
    
    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }
    
    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({ 
        success: false, 
        message: 'Account is deactivated. Please contact administrator.' 
      });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }
    
    const payload = { user: { id: user.id } };
    const expiresIn = rememberMe ? '7d' : '1h';
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
    
    logger.info('User login successful', { 
      userId: user._id, 
      username: user.username, 
      role: user.role.name 
    });
    
    res.json({ 
      success: true, 
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role.name,
        phone: user.phone || null
      }
    });
  } catch (error) {
    logger.error('Login error', { 
      error: error.message, 
      stack: error.stack,
      username: username 
    });
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('role').select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    res.json({ 
      success: true, 
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        name: user.name || user.username,
        role: user.role.name,
        phone: user.phone || null
      }
    });
  } catch (error) {
    logger.error('Get current user error', { 
      error: error.message, 
      userId: req.user.id 
    });
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
};

module.exports = { registerUser, loginUser, getCurrentUser };