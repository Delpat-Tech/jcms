// controllers/tenantController.js
const Tenant = require('../models/tenant');
const User = require('../models/user');
const Role = require('../models/role');

const createTenant = async (req, res) => {
  try {
    const { name, subdomain, adminUsername, adminEmail, adminPassword } = req.body;

    // Check if subdomain already exists
    const existingTenant = await Tenant.findOne({ subdomain });
    if (existingTenant) {
      return res.status(400).json({ success: false, message: 'Subdomain already exists' });
    }

    // Check if username already exists
    const existingUsername = await User.findOne({ username: adminUsername });
    if (existingUsername) {
      return res.status(400).json({ success: false, message: 'Username already exists' });
    }

    // Check if email already exists
    const existingEmail = await User.findOne({ email: adminEmail });
    if (existingEmail) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    // Get admin role
    const adminRole = await Role.findOne({ name: 'admin' });
    if (!adminRole) {
      return res.status(400).json({ success: false, message: 'Admin role not found' });
    }

    // Create admin user first
    const adminUser = new User({
      username: adminUsername,
      email: adminEmail,
      password: adminPassword,
      role: adminRole._id,
      tenant: null // Will be updated after tenant creation
    });
    await adminUser.save();

    // Create tenant with admin user reference
    const tenant = new Tenant({ 
      name, 
      subdomain, 
      adminUser: adminUser._id 
    });
    await tenant.save();

    // Update admin user with tenant reference
    adminUser.tenant = tenant._id;
    await adminUser.save();

    res.status(201).json({
      success: true,
      message: 'Tenant created successfully',
      tenant: { ...tenant.toObject(), adminUser: adminUser }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getTenants = async (req, res) => {
  try {
    const tenants = await Tenant.find().populate('adminUser', 'username email').sort({ createdAt: -1 });
    res.json({ success: true, tenants });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getTenantById = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id).populate('adminUser', 'username email');
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }
    res.json({ success: true, tenant });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateTenant = async (req, res) => {
  try {
    const { name, settings, isActive } = req.body;
    const tenant = await Tenant.findByIdAndUpdate(
      req.params.id,
      { name, settings, isActive },
      { new: true }
    ).populate('adminUser', 'username email');
    
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }
    
    res.json({ success: true, tenant });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteTenant = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    // Delete all users in this tenant
    await User.deleteMany({ tenant: tenant._id });
    
    // Delete the tenant
    await Tenant.findByIdAndDelete(req.params.id);
    
    res.json({ success: true, message: 'Tenant and all associated data deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createTenantUser = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { username, email, password, phone, roleName = 'editor' } = req.body;

    // Check if tenant exists
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    // Check if user can manage this tenant
    if (req.user.role.name !== 'superadmin' && req.user.tenant?._id?.toString() !== tenantId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Check if username/email already exists
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Username or email already exists' });
    }

    // Get role
    const role = await Role.findOne({ name: roleName });
    if (!role) {
      return res.status(400).json({ success: false, message: 'Role not found' });
    }

    // Create user
    const userData = {
      username,
      email,
      password,
      phone: phone || `auto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role: role._id,
      tenant: tenantId
    };
    
    const user = new User(userData);
    await user.save();

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: { id: user._id, username, email, role: roleName }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getTenantUsers = async (req, res) => {
  try {
    const { tenantId } = req.params;

    // Check if user can view this tenant's users
    if (req.user.role.name !== 'superadmin' && req.user.tenant?._id?.toString() !== tenantId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const users = await User.find({ tenant: tenantId })
      .populate('role', 'name')
      .select('username email role isActive createdAt')
      .sort({ createdAt: -1 });

    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const assignUserToTenant = async (req, res) => {
  try {
    const { userId, tenantId } = req.params;

    // Only superadmin can reassign users between tenants
    if (req.user.role.name !== 'superadmin') {
      return res.status(403).json({ success: false, message: 'Only superadmin can reassign users' });
    }

    const [user, tenant] = await Promise.all([
      User.findById(userId),
      Tenant.findById(tenantId)
    ]);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    user.tenant = tenantId;
    await user.save();

    res.json({ success: true, message: 'User assigned to tenant successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const removeTenantUser = async (req, res) => {
  try {
    const { tenantId, userId } = req.params;

    // Check if user can manage this tenant
    if (req.user.role.name !== 'superadmin' && req.user.tenant?._id?.toString() !== tenantId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const user = await User.findOne({ _id: userId, tenant: tenantId }).populate('role');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found in this tenant' });
    }

    // Don't allow removing tenant admin
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }
    if (tenant.adminUser.toString() === userId) {
      return res.status(400).json({ success: false, message: 'Cannot remove tenant admin' });
    }

    // Check if user is already deactivated
    if (!user.isActive) {
      return res.status(400).json({ 
        success: false, 
        message: 'User is already deactivated' 
      });
    }

    // Role-based deletion permissions
    const currentUserRole = req.user.role.name;
    const targetUserRole = user.role.name;
    
    if (currentUserRole === 'admin') {
      // Admin can only delete editor and viewer roles within their tenant
      if (!['editor', 'viewer'].includes(targetUserRole)) {
        return res.status(403).json({ 
          success: false, 
          message: 'Admin can only deactivate editor and viewer users' 
        });
      }
    }
    // Superadmin can delete any user (including editors)

    // Soft delete: Set isActive to false instead of hard deletion
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        isActive: false,
        deactivatedAt: new Date(),
        deactivatedBy: req.user.id
      },
      { new: true, select: 'username email isActive deactivatedAt' }
    ).populate('role', 'name');
    
    res.json({ 
      success: true, 
      message: 'User deactivated from tenant successfully',
      data: updatedUser
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createTenant,
  getTenants,
  getTenantById,
  updateTenant,
  deleteTenant,
  createTenantUser,
  getTenantUsers,
  assignUserToTenant,
  removeTenantUser
};