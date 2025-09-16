// middlewares/tenantMiddleware.js
const mongoose = require('mongoose');

/**
 * Enhanced tenant filtering middleware that ensures strict data isolation
 */
const enforceTenantIsolation = (options = {}) => {
  const {
    allowSuperAdminBypass = true,
    requireTenantMatch = true,
    allowOwnDataOnly = false // For editors/viewers
  } = options;

  return (req, res, next) => {
    try {
      // Initialize tenant filter object
      req.tenantFilter = {};
      req.tenantAccess = {
        canAccessAllTenants: false,
        canAccessOwnTenant: false,
        canAccessOwnDataOnly: false,
        userTenantId: null,
        userRole: null
      };

      if (!req.user || !req.user.role) {
        return res.status(401).json({ 
          success: false, 
          message: 'User authentication required for tenant access' 
        });
      }

      const userRole = req.user.role.name;
      const userTenantId = req.user.tenant?._id;

      // Set access permissions
      req.tenantAccess.userRole = userRole;
      req.tenantAccess.userTenantId = userTenantId;

      if (userRole === 'superadmin' && allowSuperAdminBypass) {
        // Superadmin can access all tenants
        req.tenantAccess.canAccessAllTenants = true;
        req.tenantFilter = {}; // No filter - can see everything
      } else {
        // All other roles are restricted to their tenant
        req.tenantAccess.canAccessOwnTenant = true;
        
        if (requireTenantMatch && !userTenantId) {
          return res.status(403).json({
            success: false,
            message: 'User must be assigned to a tenant to access this resource'
          });
        }

        req.tenantFilter = { 
          tenant: userTenantId || null 
        };

        // Additional restrictions for editors/viewers
        if (allowOwnDataOnly && ['editor', 'viewer'].includes(userRole)) {
          req.tenantAccess.canAccessOwnDataOnly = true;
          req.tenantFilter.user = req.user.id;
        }
      }

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Tenant access control error',
        error: error.message
      });
    }
  };
};

/**
 * Validate tenant access for specific operations
 */
const validateTenantAccess = (resourceTenantId, req) => {
  const { canAccessAllTenants, userTenantId } = req.tenantAccess;
  
  if (canAccessAllTenants) {
    return { allowed: true };
  }
  
  const resourceTenant = resourceTenantId ? resourceTenantId.toString() : null;
  const userTenant = userTenantId ? userTenantId.toString() : null;
  
  if (userTenant !== resourceTenant) {
    return {
      allowed: false,
      message: 'Access denied. Resource belongs to a different tenant.'
    };
  }
  
  return { allowed: true };
};

/**
 * Middleware to validate resource ownership
 */
const validateResourceOwnership = (getResourceFn, options = {}) => {
  const { 
    adminCanAccess = true,
    paramName = 'id' 
  } = options;

  return async (req, res, next) => {
    try {
      const resourceId = req.params[paramName];
      
      if (!resourceId) {
        return res.status(400).json({
          success: false,
          message: 'Resource ID required'
        });
      }

      const resource = await getResourceFn(resourceId);
      
      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found'
        });
      }

      // Check tenant access
      const tenantAccess = validateTenantAccess(resource.tenant, req);
      if (!tenantAccess.allowed) {
        return res.status(403).json({
          success: false,
          message: tenantAccess.message
        });
      }

      // Check ownership for non-admin users
      const { userRole } = req.tenantAccess;
      const resourceUserId = resource.user ? resource.user.toString() : null;
      const currentUserId = req.user.id.toString();

      if (userRole !== 'superadmin' && 
          (!adminCanAccess || userRole !== 'admin') &&
          resourceUserId !== currentUserId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only access your own resources.'
        });
      }

      // Attach resource to request for use in controller
      req.resource = resource;
      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Resource validation error',
        error: error.message
      });
    }
  };
};

/**
 * Middleware to enforce tenant-specific pagination and sorting
 */
const applyTenantPagination = (Model, defaultLimit = 20) => {
  return async (req, res, next) => {
    try {
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || defaultLimit));
      const skip = (page - 1) * limit;
      
      // Build sort object
      const sortBy = req.query.sortBy || 'createdAt';
      const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
      const sort = { [sortBy]: sortOrder };
      
      // Apply tenant filter
      const filter = { ...req.tenantFilter };
      
      // Add search if provided
      if (req.query.search) {
        const searchRegex = new RegExp(req.query.search, 'i');
        
        // Determine searchable fields based on model
        let searchFields = [];
        if (Model.schema.paths.title) searchFields.push('title');
        if (Model.schema.paths.name) searchFields.push('name');
        if (Model.schema.paths.username) searchFields.push('username');
        if (Model.schema.paths.email) searchFields.push('email');
        
        if (searchFields.length > 0) {
          filter.$or = searchFields.map(field => ({
            [field]: searchRegex
          }));
        }
      }
      
      req.pagination = {
        filter,
        sort,
        skip,
        limit,
        page,
        search: req.query.search || ''
      };
      
      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Pagination setup error',
        error: error.message
      });
    }
  };
};

/**
 * Helper function to apply tenant isolation to any mongoose query
 */
const applyTenantFilter = (query, tenantFilter) => {
  return query.where(tenantFilter);
};

/**
 * Middleware to log tenant access attempts
 */
const logTenantAccess = (resourceType = 'unknown') => {
  return (req, res, next) => {
    const { userRole, userTenantId, canAccessAllTenants } = req.tenantAccess;
    const method = req.method;
    const path = req.path;
    
    console.log(`[TENANT ACCESS] ${method} ${path} | User: ${req.user.username} | Role: ${userRole} | Tenant: ${userTenantId || 'none'} | Resource: ${resourceType} | CanAccessAll: ${canAccessAllTenants}`);
    
    next();
  };
};

module.exports = {
  enforceTenantIsolation,
  validateTenantAccess,
  validateResourceOwnership,
  applyTenantPagination,
  applyTenantFilter,
  logTenantAccess
};