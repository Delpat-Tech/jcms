// src/routes/superadminRoutes.js
const express = require('express');
const { backupDatabase } = require('../utils/backup');
const { authenticate, requireSuperAdmin } = require('../middlewares/auth');
const Role = require('../models/role');
const router = express.Router();

// All routes require authentication and superadmin role
router.use(authenticate, requireSuperAdmin);

// Roles management
router.get('/roles', async (req, res) => {
  try {
    const roles = await Role.find().sort({ createdAt: -1 });
    res.json({ success: true, roles });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/roles', async (req, res) => {
  try {
    const role = new Role(req.body);
    await role.save();
    res.json({ success: true, role });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.put('/roles/:id', async (req, res) => {
  try {
    const role = await Role.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!role) return res.status(404).json({ success: false, message: 'Role not found' });
    res.json({ success: true, role });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.delete('/roles/:id', async (req, res) => {
  try {
    const role = await Role.findByIdAndDelete(req.params.id);
    if (!role) return res.status(404).json({ success: false, message: 'Role not found' });
    res.json({ success: true, message: 'Role deleted' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Database backup endpoint
router.post('/backup', async (req, res) => {
  try {
    const result = await backupDatabase();
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Backup failed', 
      error: error.message 
    });
  }
});

module.exports = router;