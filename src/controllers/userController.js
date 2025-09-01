// controllers/userController.js - All user operations
const User = require('../models/user');
const Image = require('../models/image');
const bcrypt = require('bcryptjs');
const { isSystemAdmin } = require('../utils/systemAdmin');

// Create user
const createUser = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username, email, and password are required.' 
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already in use.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const userRole = role || 'viewer';

    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      role: userRole
    });

    res.status(201).json({ success: true, data: newUser });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error creating user', 
      error: error.message 
    });
  }
};

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const systemAdmin = await isSystemAdmin(req.user);
    
    let filter = {};
    if (!systemAdmin) {
      filter.tenant = req.user.tenant;
    }
    
    const users = await User.find(filter).select('-password');
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching users', error: error.message });
  }
};

// Get tenant users
const getTenantUsers = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Only admin can view users' });
    }

    const systemAdmin = await isSystemAdmin(req.user);
    
    let filter = {};
    if (!systemAdmin) {
      filter.tenant = req.user.tenant;
    }

    const users = await User.find(filter).select('username email role createdAt updatedAt');
    
    res.status(200).json({
      success: true,
      count: users.length,
      users,
      scope: systemAdmin ? 'All Tenants' : 'Current Tenant Only'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get user analytics
const getUserAnalytics = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const systemAdmin = await isSystemAdmin(req.user);
    let tenantFilter = {};
    
    if (!systemAdmin) {
      tenantFilter.tenant = req.user.tenant;
    }

    const usersByRole = await User.aggregate([
      { $match: tenantFilter },
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    const totalUsers = await User.countDocuments(tenantFilter);

    const usersWithImageCounts = await User.aggregate([
      { $match: tenantFilter },
      {
        $lookup: {
          from: 'images',
          localField: '_id',
          foreignField: 'user',
          as: 'images'
        }
      },
      {
        $project: {
          username: 1,
          email: 1,
          role: 1,
          createdAt: 1,
          imageCount: { $size: '$images' }
        }
      },
      { $sort: { imageCount: -1 } }
    ]);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentUsers = await User.countDocuments({
      ...tenantFilter,
      createdAt: { $gte: thirtyDaysAgo }
    });

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        usersByRole,
        usersWithImageCounts,
        recentUsers,
        tenantScope: systemAdmin ? 'All Tenants' : 'Current Tenant Only'
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user analytics',
      error: error.message
    });
  }
};

// Get user details with pagination
const getUserDetails = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const systemAdmin = await isSystemAdmin(req.user);
    let tenantFilter = {};
    
    if (!systemAdmin) {
      tenantFilter.tenant = req.user.tenant;
    }

    const { page = 1, limit = 10, role, search } = req.query;

    let searchFilter = { ...tenantFilter };
    if (role && ['admin', 'editor', 'viewer'].includes(role)) {
      searchFilter.role = role;
    }
    if (search) {
      searchFilter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(searchFilter)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(searchFilter);

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user details',
      error: error.message
    });
  }
};

// Get images by user
const getImagesByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const systemAdmin = await isSystemAdmin(req.user);
    
    let filter = { user: userId };
    if (!systemAdmin) {
      filter.tenant = req.user.tenant;
    }
    
    const images = await Image.find(filter);

    if (!images || images.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    res.status(200).json({ success: true, data: images });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error retrieving images', 
      error: error.message 
    });
  }
};

// Update user role
const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body || {};
    const { userId } = req.params;
    const currentUserId = req.user.id;

    if (!role) {
      return res.status(400).json({ success: false, message: 'Role is required' });
    }

    if (!['admin', 'editor', 'viewer'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    if (userId === currentUserId && role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'You cannot demote yourself from admin' 
      });
    }

    const systemAdmin = await isSystemAdmin(req.user);
    
    let filter = { _id: userId };
    if (!systemAdmin) {
      filter.tenant = req.user.tenant;
    }

    const user = await User.findOneAndUpdate(
      filter,
      { role },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, data: user });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error updating role', error: err.message });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (req.user.id === userId) {
      return res.status(403).json({ success: false, message: "You cannot delete yourself" });
    }

    const systemAdmin = await isSystemAdmin(req.user);
    
    let filter = { _id: userId };
    if (!systemAdmin) {
      filter.tenant = req.user.tenant;
    }

    const user = await User.findOneAndDelete(filter);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error deleting user", error: err.message });
  }
};

module.exports = {
  createUser,
  getAllUsers,
  getTenantUsers,
  getUserAnalytics,
  getUserDetails,
  getImagesByUser,
  updateUserRole,
  deleteUser
};