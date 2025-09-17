// controllers/tenantController.js
const Tenant = require('../models/tenant');
const User = require('../models/user');
const Role = require('../models/role');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { sanitizePath, sanitizeFilename } = require('../utils/pathSanitizer');

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

    const Image = require('../models/image');
    const fs = require('fs');
    const path = require('path');

    // Delete all users in this tenant
    await User.deleteMany({ tenant: tenant._id });
    
    // Delete all images belonging to this tenant
    const images = await Image.find({ tenant: tenant._id });
    for (const image of images) {
      // Delete physical file
      if (image.filePath && fs.existsSync(image.filePath)) {
        fs.unlinkSync(image.filePath);
      }
    }
    await Image.deleteMany({ tenant: tenant._id });
    
    // Delete tenant upload directory
    const tenantUploadDir = path.join(__dirname, '../../uploads', tenant._id.toString());
    if (fs.existsSync(tenantUploadDir)) {
      fs.rmSync(tenantUploadDir, { recursive: true, force: true });
    }
    
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

// Bulk operations for tenant users
const bulkCreateTenantUsers = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { users } = req.body; // Array of user objects

    // Check if tenant exists
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    // Check if user can manage this tenant
    if (req.user.role.name !== 'superadmin' && req.user.tenant?._id?.toString() !== tenantId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const results = {
      created: [],
      errors: []
    };

    for (const userData of users) {
      try {
        const { username, email, password, phone, roleName = 'editor' } = userData;

        // Check if username/email already exists
        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
          results.errors.push({ userData, error: 'Username or email already exists' });
          continue;
        }

        // Get role
        const role = await Role.findOne({ name: roleName });
        if (!role) {
          results.errors.push({ userData, error: `Role '${roleName}' not found` });
          continue;
        }

        // Create user
        const newUserData = {
          username,
          email,
          password,
          phone: phone || `auto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          role: role._id,
          tenant: tenantId
        };
        
        const user = new User(newUserData);
        await user.save();
        
        results.created.push({ id: user._id, username, email, role: roleName });
      } catch (error) {
        results.errors.push({ userData, error: error.message });
      }
    }

    res.status(201).json({
      success: true,
      message: `Bulk operation completed: ${results.created.length} users created, ${results.errors.length} errors`,
      results
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const bulkUpdateTenantUsers = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { userIds, updates } = req.body; // Array of user IDs and updates object

    // Check if user can manage this tenant
    if (req.user.role.name !== 'superadmin' && req.user.tenant?._id?.toString() !== tenantId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const results = {
      updated: [],
      errors: []
    };

    for (const userId of userIds) {
      try {
        const user = await User.findOne({ _id: userId, tenant: tenantId }).populate('role');
        if (!user) {
          results.errors.push({ userId, error: 'User not found in this tenant' });
          continue;
        }

        // Prepare update data
        const updateData = {};
        if (updates.isActive !== undefined) updateData.isActive = updates.isActive;
        if (updates.role) {
          const role = await Role.findOne({ name: updates.role });
          if (role) {
            updateData.role = role._id;
          } else {
            results.errors.push({ userId, error: `Role '${updates.role}' not found` });
            continue;
          }
        }

        const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true })
          .populate('role', 'name')
          .select('username email role isActive');
        
        results.updated.push(updatedUser);
      } catch (error) {
        results.errors.push({ userId, error: error.message });
      }
    }

    res.json({
      success: true,
      message: `Bulk update completed: ${results.updated.length} users updated, ${results.errors.length} errors`,
      results
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const bulkDeleteTenantUsers = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { userIds } = req.body; // Array of user IDs

    // Check if user can manage this tenant
    if (req.user.role.name !== 'superadmin' && req.user.tenant?._id?.toString() !== tenantId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    const results = {
      deactivated: [],
      errors: []
    };

    for (const userId of userIds) {
      try {
        // Don't allow removing tenant admin
        if (tenant.adminUser.toString() === userId) {
          results.errors.push({ userId, error: 'Cannot remove tenant admin' });
          continue;
        }

        const user = await User.findOne({ _id: userId, tenant: tenantId }).populate('role');
        if (!user) {
          results.errors.push({ userId, error: 'User not found in this tenant' });
          continue;
        }

        // Check if user is already deactivated
        if (!user.isActive) {
          results.errors.push({ userId, error: 'User is already deactivated' });
          continue;
        }

        // Role-based deletion permissions
        const currentUserRole = req.user.role.name;
        const targetUserRole = user.role.name;
        
        if (currentUserRole === 'admin' && !['editor', 'viewer'].includes(targetUserRole)) {
          results.errors.push({ userId, error: 'Admin can only deactivate editor and viewer users' });
          continue;
        }

        // Soft delete: Set isActive to false
        const updatedUser = await User.findByIdAndUpdate(
          userId,
          {
            isActive: false,
            deactivatedAt: new Date(),
            deactivatedBy: req.user.id
          },
          { new: true, select: 'username email isActive deactivatedAt' }
        ).populate('role', 'name');
        
        results.deactivated.push(updatedUser);
      } catch (error) {
        results.errors.push({ userId, error: error.message });
      }
    }

    res.json({
      success: true,
      message: `Bulk deactivation completed: ${results.deactivated.length} users deactivated, ${results.errors.length} errors`,
      results
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get tenant statistics
const getTenantStats = async (req, res) => {
  try {
    const { tenantId } = req.params;

    // Check if user can view this tenant's stats
    if (req.user.role.name !== 'superadmin' && req.user.tenant?._id?.toString() !== tenantId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    // Get user statistics
    const [totalUsers, activeUsers, usersByRole] = await Promise.all([
      User.countDocuments({ tenant: tenantId }),
      User.countDocuments({ tenant: tenantId, isActive: true }),
      User.aggregate([
        { $match: { tenant: new require('mongoose').Types.ObjectId(tenantId) } },
        { $lookup: { from: 'roles', localField: 'role', foreignField: '_id', as: 'roleData' } },
        { $unwind: '$roleData' },
        { $group: { _id: '$roleData.name', count: { $sum: 1 } } }
      ])
    ]);

    // Get image statistics
    const Image = require('../models/image');
    const [totalImages, imageStats] = await Promise.all([
      Image.countDocuments({ tenant: tenantId }),
      Image.aggregate([
        { $match: { tenant: new require('mongoose').Types.ObjectId(tenantId) } },
        { $group: {
          _id: null,
          totalSize: { $sum: '$fileSize' },
          avgSize: { $avg: '$fileSize' },
          totalImages: { $sum: 1 }
        }}
      ])
    ]);

    // Get file statistics
    const File = require('../models/file');
    const [totalFiles, fileStats] = await Promise.all([
      File.countDocuments({ tenant: tenantId }),
      File.aggregate([
        { $match: { tenant: new require('mongoose').Types.ObjectId(tenantId) } },
        { $group: {
          _id: null,
          totalSize: { $sum: '$fileSize' },
          avgSize: { $avg: '$fileSize' },
          totalFiles: { $sum: 1 }
        }}
      ])
    ]);

    const stats = {
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers,
        byRole: usersByRole.reduce((acc, role) => {
          acc[role._id] = role.count;
          return acc;
        }, {})
      },
      images: {
        total: totalImages,
        totalSize: imageStats[0]?.totalSize || 0,
        avgSize: imageStats[0]?.avgSize || 0
      },
      files: {
        total: totalFiles,
        totalSize: fileStats[0]?.totalSize || 0,
        avgSize: fileStats[0]?.avgSize || 0
      },
      storage: {
        totalUsed: (imageStats[0]?.totalSize || 0) + (fileStats[0]?.totalSize || 0),
        maxAllowed: tenant.settings?.maxStorage || '10GB'
      }
    };

    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Export user data for a tenant
const exportTenantUsers = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { format = 'json' } = req.query; // json or csv

    // Check if user can manage this tenant
    if (req.user.role.name !== 'superadmin' && req.user.tenant?._id?.toString() !== tenantId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const users = await User.find({ tenant: tenantId })
      .populate('role', 'name')
      .select('username email role isActive createdAt deactivatedAt')
      .sort({ createdAt: -1 });

    if (format === 'csv') {
      const csvHeader = 'Username,Email,Role,Status,Created At,Deactivated At\n';
      const csvData = users.map(user => 
        `${user.username},${user.email},${user.role.name},${user.isActive ? 'Active' : 'Inactive'},${user.createdAt?.toISOString() || ''},${user.deactivatedAt?.toISOString() || ''}`
      ).join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="tenant-${tenantId}-users.csv"`);
      res.send(csvHeader + csvData);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="tenant-${tenantId}-users.json"`);
      res.json({ success: true, users });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const uploadTenantLogo = async (req, res) => {
  try {
    const { tenantId } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No logo file uploaded' });
    }

    // Check permissions
    if (req.user.role.name !== 'superadmin' && req.user.tenant?._id?.toString() !== tenantId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    // Create tenant logo directory
    const logoDir = path.join(__dirname, '../../uploads/tenants', tenantId, 'branding');
    fs.mkdirSync(logoDir, { recursive: true });

    // Process and save logo
    const sanitizedFilename = sanitizeFilename(req.file.originalname);
    const baseName = path.parse(sanitizedFilename).name + '-logo-' + Date.now();
    const logoPath = path.join(logoDir, `${baseName}.webp`);
    
    // Resize and optimize logo
    await sharp(req.file.buffer)
      .resize(200, 200, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 90 })
      .toFile(logoPath);

    // Update tenant with logo info
    const logoUrl = `/uploads/tenants/${tenantId}/branding/${baseName}.webp`;
    tenant.branding.logo = {
      url: logoUrl,
      filename: `${baseName}.webp`,
      uploadedAt: new Date()
    };
    
    await tenant.save();

    res.json({
      success: true,
      message: 'Logo uploaded successfully',
      logo: tenant.branding.logo
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
  removeTenantUser,
  bulkCreateTenantUsers,
  bulkUpdateTenantUsers,
  bulkDeleteTenantUsers,
  getTenantStats,
  exportTenantUsers,
  uploadTenantLogo
};
