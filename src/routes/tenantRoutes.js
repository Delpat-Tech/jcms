// routes/tenantRoutes.js
const express = require('express');
const { createTenant, getTenants } = require('../controllers/tenantController');
const router = express.Router();

router.post('/', createTenant);
router.get('/', getTenants);

module.exports = router;