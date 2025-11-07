/**
 * Role constants
 */

module.exports = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  EDITOR: 'editor',
  
  ALL_ROLES: ['superadmin', 'admin', 'editor'],
  
  ADMIN_ROLES: ['superadmin', 'admin'],
  
  hasRole: (userRole, allowedRoles) => {
    return allowedRoles.includes(userRole);
  },
  
  isSuperAdmin: (userRole) => {
    return userRole === 'superadmin';
  },
  
  isAdmin: (userRole) => {
    return userRole === 'admin' || userRole === 'superadmin';
  }
};
