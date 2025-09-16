// controllers/tenantSwitchingController.js
const User = require('../models/user');
const Tenant = require('../models/tenant');

// Get user's accessible tenants
const getUserAccessibleTenants = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role.name;

    let tenants = [];

    if (userRole === 'superadmin') {
      // Superadmin can access all active tenants
      tenants = await Tenant.find({ isActive: true })
        .select('_id name subdomain branding.logo branding.colors')
        .sort({ name: 1 });
    } else {
      // Regular users can access:
      // 1. Their own tenant
      // 2. Any tenants they have explicit access to (future feature)
      
      const user = await User.findById(userId).populate({
        path: 'tenant',
        select: '_id name subdomain branding.logo branding.colors',
        match: { isActive: true }
      });

      if (user.tenant) {
        tenants = [user.tenant];
      }

      // TODO: Add support for multi-tenant users (users with access to multiple tenants)
      // This could be implemented with a separate UserTenantAccess model or array field
    }

    // Format tenant data for frontend
    const formattedTenants = tenants.map(tenant => ({
      id: tenant._id,
      name: tenant.name,
      subdomain: tenant.subdomain,
      logo: tenant.branding?.logo?.url ? {
        url: `${req.protocol}://${req.get('host')}/${tenant.branding.logo.url}`
      } : null,
      colors: tenant.branding?.colors || {
        primary: '#3b82f6',
        secondary: '#64748b'
      }
    }));

    res.json({
      success: true,
      tenants: formattedTenants,
      currentTenant: req.user.tenant?._id?.toString() || null
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Switch user's current tenant context (for superadmin and multi-tenant users)
const switchTenantContext = async (req, res) => {
  try {
    const { tenantId } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role.name;

    if (!tenantId) {
      return res.status(400).json({ success: false, message: 'Tenant ID is required' });
    }

    // Verify tenant exists and is active
    const tenant = await Tenant.findOne({ _id: tenantId, isActive: true })
      .select('_id name subdomain branding.logo branding.colors');

    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found or inactive' });
    }

    // Check if user has access to this tenant
    let hasAccess = false;

    if (userRole === 'superadmin') {
      hasAccess = true;
    } else {
      // Check if it's the user's own tenant
      if (req.user.tenant?._id?.toString() === tenantId) {
        hasAccess = true;
      }
      // TODO: Check additional tenant access permissions here
    }

    if (!hasAccess) {
      return res.status(403).json({ 
        success: false, 
        message: 'You do not have access to this tenant' 
      });
    }

    // For this implementation, we don't actually change the user's tenant in the database
    // Instead, we return the tenant context for frontend state management
    // In a full implementation, you might want to update a "current context" field

    const tenantInfo = {
      id: tenant._id,
      name: tenant.name,
      subdomain: tenant.subdomain,
      logo: tenant.branding?.logo?.url ? {
        url: `${req.protocol}://${req.get('host')}/${tenant.branding.logo.url}`
      } : null,
      colors: tenant.branding?.colors || {
        primary: '#3b82f6',
        secondary: '#64748b'
      }
    };

    res.json({
      success: true,
      message: 'Tenant context switched successfully',
      tenant: tenantInfo
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get tenant info by subdomain (for public access)
const getTenantBySubdomain = async (req, res) => {
  try {
    const { subdomain } = req.params;

    const tenant = await Tenant.findOne({ 
      subdomain: subdomain.toLowerCase(), 
      isActive: true 
    }).select('_id name subdomain branding');

    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    // Format branding info
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const branding = { ...tenant.branding.toObject() };
    
    if (branding.logo?.url) {
      branding.logo.url = `${baseUrl}/${branding.logo.url}`;
    }
    if (branding.favicon?.url) {
      branding.favicon.url = `${baseUrl}/${branding.favicon.url}`;
    }

    res.json({
      success: true,
      tenant: {
        id: tenant._id,
        name: tenant.name,
        subdomain: tenant.subdomain,
        branding
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get current user's tenant context
const getCurrentTenantContext = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate({
        path: 'tenant',
        select: '_id name subdomain branding',
        match: { isActive: true }
      })
      .populate('role', 'name');

    if (!user.tenant && user.role.name !== 'superadmin') {
      return res.status(404).json({ 
        success: false, 
        message: 'No tenant context found' 
      });
    }

    let tenantInfo = null;
    
    if (user.tenant) {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const branding = { ...user.tenant.branding.toObject() };
      
      if (branding.logo?.url) {
        branding.logo.url = `${baseUrl}/${branding.logo.url}`;
      }
      if (branding.favicon?.url) {
        branding.favicon.url = `${baseUrl}/${branding.favicon.url}`;
      }

      tenantInfo = {
        id: user.tenant._id,
        name: user.tenant.name,
        subdomain: user.tenant.subdomain,
        branding
      };
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role.name
      },
      tenant: tenantInfo
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getUserAccessibleTenants,
  switchTenantContext,
  getTenantBySubdomain,
  getCurrentTenantContext
};