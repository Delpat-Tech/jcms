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
  const { username, password } = req.body;
  
  try {
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username and password are required' 
      });
    }

    const user = await User.findOne({ username }).populate('role');
    
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
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
    
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
        role: user.role.name
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

module.exports = { registerUser, loginUser };