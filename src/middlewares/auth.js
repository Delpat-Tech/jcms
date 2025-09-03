// middlewares/auth.js
const User = require('../models/user');
const jwt = require('jsonwebtoken');


module.exports = async function(req, res, next) {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findById(decoded.user.id).select('username email');
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    req.user = { 
      id: user._id, 
      username: user.username,
      email: user.email
    };
    
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};