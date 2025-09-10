// src/controllers/userController.js
const User = require('../models/user');
const Role = require('../models/role');
const Image = require('../models/image');

// Create user with role assignment
const createUserWithRole = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username, email, and password are required.' 
      });
    }

    // Check user permissions for role assignment
    const currentUser = await User.findById(req.user.id).populate('role');
    const currentRole = currentUser.role.name;
    
    let validRoles;
    if (currentRole === 'superadmin') {
      validRoles = ['admin', 'editor', 'viewer']; // SuperAdmin cannot create another superadmin
    } else if (currentRole === 'admin') {
      validRoles = ['editor', 'viewer']; // Admin cannot create admin or superadmin
    } else {
      return res.status(403).json({ 
        success: false, 
        message: 'Insufficient permissions to create users' 
      });
    }
    
    const roleName = role || 'editor';
    
    if (!validRoles.includes(roleName)) {
      return res.status(400).json({ 
        success: false, 
        message: `Invalid role. You can only create: ${validRoles.join(', ')}` 
      });
    }

    const roleDoc = await Role.findOne({ name: roleName });
    
    if (!roleDoc) {
      return res.status(400).json({ 
        success: false, 
        message: 'Role not found in database' 
      });
    }

    // Set tenant for new user based on current user's tenant
    const userData = { 
      username, 
      email, 
      password,
      role: roleDoc._id
    };
    
    // Only set tenant if current user is not superadmin
    if (currentRole !== 'superadmin') {
      userData.tenant = req.user.tenant;
    }
    
    const newUser = await User.create(userData);

    // Populate role for response (excluding permissions)
    await newUser.populate({
      path: 'role',
      select: 'name description -_id'
    });
    
    // Remove password from response
    const userResponse = newUser.toObject();
    delete userResponse.password;

    res.status(201).json({ 
      success: true, 
      message: 'User created successfully',
      data: userResponse 
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username or email already exists' 
      });
    }
    res.status(500).json({ 
      success: false, 
      message: 'Error creating user', 
      error: error.message 
    });
  }
};

// Get all users with role-based filtering
const getAllUsers = async (req, res) => {
  try {
    // Get current user role
    const currentUser = await User.findById(req.user.id).populate('role');
    const currentRole = currentUser.role.name;
    
    let query = {};
    
    // Role-based and tenant-based filtering
    if (currentRole === 'superadmin') {
      // SuperAdmin can see all users (no filter)
    } else if (currentRole === 'admin') {
      // Admin can only see users from their own tenant (excluding superadmin)
      const superadminRole = await Role.findOne({ name: 'superadmin' });
      query = { 
        tenant: req.user.tenant,
        role: { $ne: superadminRole._id }
      };
    } else {
      // Other roles can only see users from their own tenant
      query = { tenant: req.user.tenant };
    }
    
    const users = await User.find(query, '-password').populate({
      path: 'role',
      select: 'name description -_id'
    }).populate({
      path: 'tenant',
      select: 'name -_id'
    }).sort({ createdAt: -1 });
    res.status(200).json({ 
      success: true, 
      count: users.length,
      data: users 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error retrieving users', 
      error: error.message 
    });
  }
};

// Get user by ID with role-based access control
const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get current user role
    const currentUser = await User.findById(req.user.id).populate('role');
    const currentRole = currentUser.role.name;
    
    const user = await User.findById(userId, '-password').populate({
      path: 'role',
      select: 'name description -_id'
    }).populate({
      path: 'tenant',
      select: 'name -_id'
    });
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    // Role-based and tenant-based access control
    if (currentRole === 'admin' && user.role.name === 'superadmin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Cannot view superadmin details.' 
      });
    }
    
    // Tenant isolation - non-superadmin users can only view users from their tenant
    if (currentRole !== 'superadmin' && user.tenant && req.user.tenant && 
        user.tenant.toString() !== req.user.tenant.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Cannot view users from other tenants.' 
      });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error retrieving user', 
      error: error.message 
    });
  }
};

// Superadmin: Update user role and status
const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { username, email, role, isActive } = req.body;

    // Check current user permissions
    const currentUser = await User.findById(req.user.id).populate('role');
    
    if (!currentUser || !currentUser.role) {
      return res.status(401).json({ 
        success: false, 
        message: 'User role not found' 
      });
    }
    
    const currentRole = currentUser.role.name;
    
    // Get target user to check if it's superadmin
    const targetUser = await User.findById(userId).populate('role');
    if (!targetUser) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    if (!targetUser.role) {
      return res.status(400).json({ 
        success: false, 
        message: 'Target user role not found' 
      });
    }
    
    // Prevent non-superadmin from updating superadmin
    if (targetUser.role.name === 'superadmin' && currentRole !== 'superadmin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Cannot modify superadmin user' 
      });
    }
    
    // Tenant isolation - non-superadmin users can only update users from their tenant
    if (currentRole !== 'superadmin' && targetUser.tenant && req.user.tenant && 
        targetUser.tenant.toString() !== req.user.tenant.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Cannot modify users from other tenants' 
      });
    }

    const updateData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (role) {
      let validRoles;
      if (currentRole === 'superadmin') {
        validRoles = ['admin', 'editor', 'viewer']; // SuperAdmin cannot assign superadmin role
      } else if (currentRole === 'admin') {
        validRoles = ['editor', 'viewer']; // Admin cannot promote to admin or superadmin
      } else {
        return res.status(403).json({ 
          success: false, 
          message: 'Insufficient permissions to change user roles' 
        });
      }
      
      if (!validRoles.includes(role)) {
        return res.status(400).json({ 
          success: false, 
          message: `Invalid role. You can only assign: ${validRoles.join(', ')}` 
        });
      }
      
      const roleDoc = await Role.findOne({ name: role });
      updateData.role = roleDoc._id;
    }
    if (typeof isActive === 'boolean') updateData.isActive = isActive;

    const user = await User.findByIdAndUpdate(
      userId, 
      updateData, 
      { new: true, select: '-password' }
    );

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.status(200).json({ 
      success: true, 
      message: 'User updated successfully',
      data: user 
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username or email already exists' 
      });
    }
    res.status(500).json({ 
      success: false, 
      message: 'Error updating user', 
      error: error.message 
    });
  }
};

// Superadmin: Delete user
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check current user permissions
    const currentUser = await User.findById(req.user.id).populate('role');
    const currentRole = currentUser.role.name;
    
    // Get target user to check if it's superadmin
    const targetUser = await User.findById(userId).populate('role');
    if (!targetUser) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    // Prevent deleting the only superadmin
    if (targetUser.role.name === 'superadmin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Cannot delete the system superadmin' 
      });
    }
    
    // Admin can only delete editor/viewer, not other admins
    if (currentRole === 'admin' && targetUser.role.name === 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Admin cannot delete other admin users' 
      });
    }
    
    // Tenant isolation - non-superadmin users can only delete users from their tenant
    if (currentRole !== 'superadmin' && targetUser.tenant && req.user.tenant && 
        targetUser.tenant.toString() !== req.user.tenant.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Cannot delete users from other tenants' 
      });
    }
    
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.status(200).json({ 
      success: true, 
      message: 'User deleted successfully' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting user', 
      error: error.message 
    });
  }
};

// Legacy function - keep for backward compatibility
const createUser = async (req, res) => {
  try {
    const { username, email } = req.body;
    if (!username || !email) {
      return res.status(400).json({ success: false, message: 'Username and email are required.' });
    }
    const newUser = await User.create({ username, email });
    res.status(201).json({ success: true, data: newUser });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating user', error: error.message });
  }
};

const getImagesByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const images = await Image.find({ user: userId });

    if (!images || images.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    res.status(200).json({ success: true, data: images });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving images', error: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { username, currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const updateData = {};
    
    if (username) {
      const existingUser = await User.findOne({ username, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'Username already exists' });
      }
      updateData.username = username;
    }

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ success: false, message: 'Current password required' });
      }
      
      const bcrypt = require('bcryptjs');
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Current password is incorrect' });
      }
      
      updateData.password = newPassword;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields to update' });
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true, select: '-password' });
    
    res.status(200).json({ 
      success: true, 
      message: 'Profile updated successfully',
      data: updatedUser 
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Username already exists' });
    }
    res.status(500).json({ success: false, message: 'Error updating profile', error: error.message });
  }
};

const resetUserPassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;
    const currentUser = await User.findById(req.user.id).populate('role');
    
    if (!newPassword) {
      return res.status(400).json({ success: false, message: 'New password is required' });
    }

    const targetUser = await User.findById(userId).populate('role');
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const currentRole = currentUser.role.name;
    const targetRole = targetUser.role.name;

    // Permission checks
    if (currentRole === 'admin' && targetRole === 'editor') {
      // Admin can reset editor password within same tenant
      if (targetUser.tenant?.toString() !== req.user.tenant?.toString()) {
        return res.status(403).json({ success: false, message: 'Can only reset passwords within your tenant' });
      }
    } else if (currentRole === 'superadmin' && ['admin', 'editor', 'viewer'].includes(targetRole)) {
      // Superadmin can reset any non-superadmin password
    } else {
      return res.status(403).json({ success: false, message: 'Insufficient permissions to reset this user\'s password' });
    }

    targetUser.password = newPassword;
    await targetUser.save();
    
    res.status(200).json({ 
      success: true, 
      message: 'Password reset successfully' 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error resetting password', error: error.message });
  }
};

module.exports = {
  createUser,
  createUserWithRole,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getImagesByUser,
  updateProfile,
  resetUserPassword
};