// src/controllers/userController.js
const User = require('../models/user');
const Role = require('../models/role');
const Image = require('../models/image');
const File = require('../models/file');
const Tenant = require('../models/tenant');
const { validatePassword } = require('../utils/passwordPolicy');

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

    // Password policy
    const policy = validatePassword(password || '');
    if (!policy.valid) {
      return res.status(400).json({ success: false, message: `Password requirements not met: ${policy.errors.join(', ')}` });
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

    // Enforce single-admin-per-tenant: forbid creating 'admin' via this endpoint
    if (roleName === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Use /api/tenants/:tenantId/admin to create a tenant admin (one admin per tenant).'
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
      userData.tenant = req.user.tenant?._id || req.user.tenant;
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
    const { includeInactive = 'false', status } = req.query;
    
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
      const tenantId = req.user.tenant?._id || req.user.tenant;
      query = { 
        tenant: tenantId,
        role: { $ne: superadminRole._id }
      };
    } else {
      // Other roles can only see users from their own tenant
      const tenantId = req.user.tenant?._id || req.user.tenant;
      query = { tenant: tenantId };
    }
    
    // Filter by active status
    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    } else if (includeInactive !== 'true') {
      // By default, only show active users unless explicitly requested
      query.isActive = true;
    }
    
    const users = await User.find(query, '-password').populate({
      path: 'role',
      select: 'name description -_id'
    }).populate({
      path: 'tenant',
      select: 'name -_id'
    }).populate({
      path: 'deactivatedBy',
      select: 'username -_id'
    }).sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true, 
      count: users.length,
      filter: {
        includeInactive: includeInactive === 'true',
        status: status || 'all active',
        role: currentRole
      },
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
    
    // Check if trying to update a deactivated user (unless reactivating)
    if (!targetUser.isActive && (isActive !== true)) {
      return res.status(400).json({
        success: false, 
        message: 'Cannot update deactivated user. Use reactivate endpoint first or set isActive to true.' 
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

      // Prevent assigning 'admin' via generic update; enforce single-admin-per-tenant flow
      if (role === 'admin') {
        return res.status(400).json({
          success: false,
          message: 'Cannot assign admin role via this endpoint. Use tenant admin creation endpoint.'
        });
      }
      
      const roleDoc = await Role.findOne({ name: role });
      if (!roleDoc) {
        return res.status(400).json({
          success: false, 
          message: 'Role not found in database'
        });
      }
      updateData.role = roleDoc._id;
    }
    if (typeof isActive === 'boolean') {
      updateData.isActive = isActive;
      
      // If reactivating user, clear deactivation fields
      if (isActive === true && !targetUser.isActive) {
        updateData.deactivatedAt = null;
        updateData.deactivatedBy = null;
        updateData.reactivatedAt = new Date();
        updateData.reactivatedBy = req.user.id;
      }
      
      // If deactivating user, set deactivation fields
      if (isActive === false && targetUser.isActive) {
        updateData.deactivatedAt = new Date();
        updateData.deactivatedBy = req.user.id;
        updateData.reactivatedAt = null;
        updateData.reactivatedBy = null;
      }
    }

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
    console.error('Update user error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false, 
        message: 'Username or email already exists'
      });
    }
    
    // Check for specific null reference errors
    if (error.message.includes('Cannot read properties of null')) {
      return res.status(400).json({
        success: false, 
        message: 'User or related data not found. The user may have been deleted or corrupted.', 
        error: error.message 
      });
    }
    
    res.status(500).json({
      success: false, 
      message: 'Error updating user', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Superadmin: Delete user
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { permanent } = req.query;
    
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
    
    // Prevent deleting any superadmin; only superadmin can delete admins/editors
    if (targetUser.role.name === 'superadmin') {
      return res.status(403).json({
        success: false, 
        message: 'Cannot delete superadmin user'
      });
    }

    // Only superadmin can delete admin or editor; admins can delete editors only within their tenant
    if (currentRole !== 'superadmin') {
      if (targetUser.role.name === 'admin') {
        return res.status(403).json({ success: false, message: 'Only superadmin can delete admins' });
      }
      if (targetUser.role.name === 'editor') {
        // Admin can delete editor within same tenant
        if (currentRole !== 'admin') {
          return res.status(403).json({ success: false, message: 'Insufficient permissions' });
        }
        if (targetUser.tenant && req.user.tenant && targetUser.tenant.toString() !== req.user.tenant.toString()) {
          return res.status(403).json({ success: false, message: 'Can only modify users within your tenant' });
        }
      }
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
    
    // If target is an admin (tenant admin)
    if (targetUser.role.name === 'admin') {
      // Only superadmin can delete an admin
      if (currentRole !== 'superadmin') {
        return res.status(403).json({
          success: false,
          message: 'Only superadmin can delete tenant admins'
        });
      }

      // For soft delete, block deactivating tenant admin
      if (permanent !== 'true') {
        return res.status(403).json({
          success: false,
          message: 'Cannot deactivate tenant admin. Use permanent delete to remove tenant and its users.'
        });
      }
    }

    // Permanent delete branch
    if (permanent === 'true') {
      // If deleting a tenant admin, cascade delete tenant and all tenant users/data
      if (targetUser.role.name === 'admin' && targetUser.tenant) {
        const tenantId = targetUser.tenant._id || targetUser.tenant;

        // Find all users in the tenant
        const tenantUsers = await User.find({ tenant: tenantId }, '_id');
        const tenantUserIds = tenantUsers.map(u => u._id);

        // Delete related data for all tenant users
        await Promise.all([
          Image.deleteMany({ user: { $in: tenantUserIds } }),
          File.deleteMany({ user: { $in: tenantUserIds } })
        ]);

        // Delete all users of the tenant
        await User.deleteMany({ tenant: tenantId });

        // Finally delete the tenant
        await Tenant.findByIdAndDelete(tenantId);

        return res.status(200).json({
          success: true,
          message: 'Tenant admin and tenant (with all users and data) permanently deleted'
        });
      }

      // Otherwise, delete only this user and their related data
      await Promise.all([
        Image.deleteMany({ user: userId }),
        File.deleteMany({ user: userId })
      ]);

      const deleted = await User.findByIdAndDelete(userId);
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      return res.status(200).json({
        success: true,
        message: 'User permanently deleted'
      });
    }

    // Soft delete branch: Check if user is already deactivated
    if (!targetUser.isActive) {
      return res.status(400).json({
        success: false, 
        message: 'User is already deactivated'
      });
    }
    
    // Soft delete: Set isActive to false instead of hard deletion
    const user = await User.findByIdAndUpdate(
      userId, 
      {
        isActive: false,
        deactivatedAt: new Date(),
        deactivatedBy: req.user.id
      }, 
      { new: true, select: '-password' }
    ).populate('role', 'name');
    
    if (!user) {
      return res.status(404).json({
        success: false, 
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true, 
      message: 'User deactivated successfully',
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role.name,
        isActive: user.isActive,
        deactivatedAt: user.deactivatedAt
      }
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
    const { username, email, phone, currentPassword, newPassword } = req.body;
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

    if (email) {
      const existingEmail = await User.findOne({ email, _id: { $ne: userId } });
      if (existingEmail) {
        return res.status(400).json({ success: false, message: 'Email already exists' });
      }
      updateData.email = email;
    }

    if (phone !== undefined) {
      updateData.phone = phone;
    }

    if (newPassword) {
      const policy = validatePassword(newPassword);
      if (!policy.valid) {
        return res.status(400).json({ success: false, message: `Password requirements not met: ${policy.errors.join(', ')}` });
      }
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

    const policy = validatePassword(newPassword);
    if (!policy.valid) {
      return res.status(400).json({ success: false, message: `Password requirements not met: ${policy.errors.join(', ')}` });
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

const reactivateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check current user permissions
    const currentUser = await User.findById(req.user.id).populate('role');
    const currentRole = currentUser.role.name;
    
    // Get target user to check current status
    const targetUser = await User.findById(userId).populate('role');
    if (!targetUser) {
      return res.status(404).json({
        success: false, 
        message: 'User not found'
      });
    }
    
    // Check if user is already active
    if (targetUser.isActive) {
      return res.status(400).json({
        success: false, 
        message: 'User is already active'
      });
    }
    
    // Permission checks - same as update/delete
    if (targetUser.role.name === 'superadmin' && currentRole !== 'superadmin') {
      return res.status(403).json({
        success: false, 
        message: 'Cannot reactivate superadmin user'
      });
    }
    
    if (currentRole === 'admin' && targetUser.role.name === 'admin') {
      return res.status(403).json({
        success: false, 
        message: 'Admin cannot reactivate other admin users'
      });
    }
    
    // Tenant isolation
    if (currentRole !== 'superadmin' && targetUser.tenant && req.user.tenant && 
        targetUser.tenant.toString() !== req.user.tenant.toString()) {
      return res.status(403).json({
        success: false, 
        message: 'Cannot reactivate users from other tenants'
      });
    }
    
    // Reactivate user
    const user = await User.findByIdAndUpdate(
      userId, 
      {
        isActive: true,
        deactivatedAt: null,
        deactivatedBy: null,
        reactivatedAt: new Date(),
        reactivatedBy: req.user.id
      }, 
      { new: true, select: '-password' }
    ).populate('role', 'name');
    
    res.status(200).json({
      success: true, 
      message: 'User reactivated successfully',
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role.name,
        isActive: user.isActive,
        reactivatedAt: user.reactivatedAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false, 
      message: 'Error reactivating user', 
      error: error.message 
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new password are required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const bcrypt = require('bcryptjs');
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error changing password', error: error.message });
  }
};

const changeUsername = async (req, res) => {
  try {
    const { username } = req.body;
    const userId = req.user.id;

    if (!username) {
      return res.status(400).json({ success: false, message: 'Username is required' });
    }

    const existingUser = await User.findOne({ username, _id: { $ne: userId } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Username already exists' });
    }

    const updatedUser = await User.findByIdAndUpdate(userId, { username }, { new: true, select: '-password' });

    res.status(200).json({
      success: true,
      message: 'Username changed successfully',
      data: updatedUser
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Username already exists' });
    }
    res.status(500).json({ success: false, message: 'Error changing username', error: error.message });
  }
};

module.exports = {
  createUser,
  createUserWithRole,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  reactivateUser,
  getImagesByUser,
  updateProfile,
  resetUserPassword,
  changePassword,
  changeUsername
};