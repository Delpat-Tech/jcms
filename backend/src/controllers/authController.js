const User = require('../models/user');
const Role = require('../models/role');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logger = require('../config/logger');
const asyncHandler = require('../core/utils/asyncHandler');
const { success, error } = require('../core/utils/responseHandler');
const HTTP_STATUS = require('../core/constants/httpStatus');

const registerUser = asyncHandler(async (req, res) => {
  let { username, email, password, role: roleName = 'editor', temporary = true } = req.body;
  
  if (!password) {
    return error(res, 'Password is required', HTTP_STATUS.BAD_REQUEST);
  }
  
  // Auto-generate unique credentials for temporary users
  if (temporary) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 6);
    username = username ? `${username}_${random}` : `temp_${timestamp}_${random}`;
    email = email || `temp_${timestamp}_${random}@test.local`;
  } else {
    if (!username || !email) {
      return error(res, 'Username and email are required for permanent users', HTTP_STATUS.BAD_REQUEST);
    }
  }
  
  const existingUser = await User.findOne({ $or: [{ username }, { email }] });
  if (existingUser) {
    return error(res, 'Username or email already exists', HTTP_STATUS.BAD_REQUEST);
  }
  
  const role = await Role.findOne({ name: roleName });
  if (!role) {
    return error(res, 'Invalid role', HTTP_STATUS.BAD_REQUEST);
  }
  
  const sessionId = temporary ? `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` : null;
  const expiresAt = temporary ? new Date(Date.now() + 2 * 60 * 60 * 1000) : null; // 2 hours
  
  const user = new User({ 
    username, 
    email, 
    password, 
    role: role._id,
    isTemporary: temporary,
    sessionId,
    expiresAt
  });
  await user.save();
  
  // Auto-create test subscription for temporary users
  if (temporary) {
    const Tenant = require('../models/tenant');
    const Subscription = require('../models/subscription');
    
    // Create temporary tenant for user
    const tempTenant = await Tenant.create({
      name: `Temp Tenant ${username}`,
      subdomain: `temp_${user._id}`,
      adminUser: user._id
    });
    
    // Link user to tenant
    user.tenant = tempTenant._id;
    await user.save();
    
    // Create test subscription
    await Subscription.create({
      tenant: tempTenant._id,
      subscriptionType: 'Yearly',
      startDate: new Date(),
      endDate: expiresAt,
      razorpayOrderId: `temp_${sessionId}`,
      razorpayPaymentId: `temp_pay_${sessionId}`,
      amount: 0,
      isActive: true,
      isExpired: false
    });
  }
  
  const payload = { user: { id: user.id, sessionId } };
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: temporary ? '2h' : '1h' });
  
  logger.info('User registered', { userId: user._id, role: roleName, temporary });
  
  return res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: temporary ? 'Temporary user created with premium access (expires in 2 hours)' : 'User registered successfully',
    token,
    user: { id: user._id, username, email, role: roleName, temporary, expiresAt }
  });
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