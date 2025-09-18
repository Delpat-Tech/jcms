// src/routes/superadminRoutes.js
const express = require('express');
const { backupDatabase } = require('../utils/backup');
const { authenticate, requireSuperAdmin } = require('../middlewares/auth');
const Role = require('../models/role');
const Settings = require('../models/settings');
const router = express.Router();

// All routes require authentication and superadmin role
router.use((req, res, next) => {
  console.log('Superadmin route accessed:', req.path);
  console.log('User from token:', req.user);
  next();
}, authenticate, requireSuperAdmin);

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Superadmin routes working' });
});

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

// Settings management
router.get('/settings', async (req, res) => {
  console.log('Settings GET route hit');
  try {
    // Create default settings if none exist
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
      await settings.save();
    }
    console.log('Settings retrieved:', settings);
    res.json({ success: true, settings });
  } catch (error) {
    console.error('Settings GET error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/settings', async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings(req.body);
    } else {
      Object.assign(settings, req.body);
    }
    await settings.save();
    res.json({ success: true, settings });
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