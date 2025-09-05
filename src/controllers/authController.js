// controllers/authController.js
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const registerUser = async (req, res) => {
  return res.status(403).json({ 
    success: false,
    message: 'Public registration is disabled. Contact an administrator to create your account.' 
  });
};

const loginUser = async (req, res) => {
  const { email, username, password } = req.body;
  try {
    // Allow login with either email or username
    const loginField = email || username;
    const user = await User.findOne({
      $or: [{ email: loginField }, { username: loginField }]
    });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }
    const payload = { user: { id: user.id } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ success: true, token });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

module.exports = { registerUser, loginUser };