// src/middlewares/editorRestriction.js
const restrictEditorAccess = (req, res, next) => {
  // Block editors from accessing user management endpoints
  if (req.user.role.name === 'editor' || req.user.role.name === 'viewer') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Editors cannot access user management.'
    });
  }
  next();
};

module.exports = { restrictEditorAccess };