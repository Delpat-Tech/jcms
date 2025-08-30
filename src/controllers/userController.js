// src/controllers/userController.js
const User = require('../models/user');
const Image = require('../models/image');
const bcrypt = require('bcryptjs');

// Create a user with authentication support
const createUser = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username, email, and password are required.' 
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already in use.' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Default role is 'viewer' if not provided
    const userRole = role || 'viewer';

    // Create new user
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

// Get all images for a specific user
const getImagesByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const images = await Image.find({ user: userId });

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

// Get all users (admin-only)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password'); // hide passwords
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching users', error: error.message });
  }
};

// Update a user's role (admin-only)
const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body || {};   // ← fallback if req.body is undefined
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

    const user = await User.findByIdAndUpdate(
      userId,
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
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Prevent self-deletion if needed
    if (req.user.id === userId) {
      return res.status(403).json({ success: false, message: "You cannot delete yourself" });
    }

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error deleting user", error: err.message });
  }
};


const getTenantUsers = async (req, res) => {
  try {
    // req.user is set by auth middleware
    const tenantId = req.user.tenant;

    // Only admin can access
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Only admin can view users' });
    }

    const users = await User.find({ tenant: tenantId }).select('username email role createdAt updatedAt');
    
    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

module.exports = {
  createUser,
  getImagesByUser,
  getAllUsers,
  updateUserRole,
  deleteUser,
  getTenantUsers
};
