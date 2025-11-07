const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logger = require('../config/logger');
const asyncHandler = require('../core/utils/asyncHandler');
const { success, error } = require('../core/utils/responseHandler');
const HTTP_STATUS = require('../core/constants/httpStatus');

const registerUser = asyncHandler(async (req, res) => {
  return error(res, 'Public registration is disabled. Contact an administrator.', HTTP_STATUS.FORBIDDEN);
});

const loginUser = asyncHandler(async (req, res) => {
  const { username, email, password, rememberMe } = req.body;
  
  const loginField = username || email;
  if (!loginField || !password) {
    return error(res, 'Username/email and password are required', HTTP_STATUS.BAD_REQUEST);
  }

  const user = await User.findOne({ 
    $or: [{ username: loginField }, { email: loginField }]
  }).populate('role');
  
  if (!user) {
    return error(res, 'Invalid credentials', HTTP_STATUS.BAD_REQUEST);
  }
  
  if (!user.isActive) {
    return error(res, 'Account is deactivated. Contact administrator.', HTTP_STATUS.FORBIDDEN);
  }
  
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return error(res, 'Invalid credentials', HTTP_STATUS.BAD_REQUEST);
  }
  
  const payload = { user: { id: user.id } };
  const expiresIn = rememberMe ? '7d' : '1h';
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
  
  logger.info('User login', { userId: user._id, role: user.role.name });
  
  return res.json({
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
});

const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).populate('role').select('-password');
  
  if (!user) {
    return error(res, 'User not found', HTTP_STATUS.NOT_FOUND);
  }
  
  return success(res, {
    id: user._id,
    username: user.username,
    email: user.email,
    name: user.name || user.username,
    role: user.role.name,
    phone: user.phone || null
  });
});

module.exports = { registerUser, loginUser, getCurrentUser };