// middlewares/auth.js
const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  // Get token from Authorization header
  const token = req.header('Authorization')?.replace('Bearer ', '');

  // Check if no token is present
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  // Verify the token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id, role: decoded.role }; // id + role
    
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};