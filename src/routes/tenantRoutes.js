// routes/tenantRoutes.js
const express = require('express');
const { createTenant, getTenants } = require('../controllers/tenantController');
const auth = require('../middlewares/auth');
const permit = require('../middlewares/rbac');

const router = express.Router();

// Only system admins can manage tenants
router.post('/', auth, permit('admin'), createTenant);
router.get('/', auth, permit('admin'), getTenants);

module.exports = router;