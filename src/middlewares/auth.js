// middlewares/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/user');

module.exports = async function(req, res, next) {
  // Get token from Authorization header
  const token = req.header('Authorization')?.replace('Bearer ', '');

  // Check if no token is present
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  // Verify the token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Fetch user details including username
    const user = await User.findById(decoded.id).select('username role tenant');
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    req.user = { 
      id: user._id, 
      username: user.username, 
      role: user.role, 
      tenant: user.tenant 
    };
    
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};