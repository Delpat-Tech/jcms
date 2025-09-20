// src/middlewares/editorRestriction.js
const restrictEditorAccess = (req, res, next) => {
  // Block editors and viewers from accessing user management endpoints
  // Allow superadmin and admin roles
  if (!req.user || !req.user.role) {
    return res.status(401).json({
      success: false,
      message: 'User role not found'
    });
  }
  
  const userRole = req.user.role.name;
  
  if (userRole === 'editor' || userRole === 'viewer') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Editors and viewers cannot access user management.'
    });
  }
  
  // Allow superadmin and admin to proceed
  next();
};

module.exports = { restrictEditorAccess };