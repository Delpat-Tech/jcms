// middlewares/rbac.js

// allowedRoles is an array of roles that can access the route
const permit = (...allowedRoles) => {
  return (req, res, next) => {
    // req.user must be set by auth middleware
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized: No user logged in' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: Access denied' });
    }

    next();
  };
};

module.exports = permit;
