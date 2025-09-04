// src/routes/superadminRoutes.js
const express = require('express');
const { authenticate, requireSuperAdmin } = require('../middlewares/auth');
const router = express.Router();

// All routes require authentication and superadmin role
router.use(authenticate, requireSuperAdmin);

// User management has been moved to unified /api/users routes

module.exports = router;