// server.js
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, 'backend/.env') });

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const connectDB = require("./backend/src/config/db");
const { runSeeds } = require('./backend/src/seeds');
const logger = require('./backend/src/config/logger');

const app = express();
const PORT = parseInt(process.env.PORT) || 5000;

// Connect to MongoDB
try {
  connectDB();
} catch (error) {
  logger.error('Database connection failed', { error: error.message });
  process.exit(1);
}

// Optional seeding on startup
if (process.env.AUTO_SEED === 'true') {
  setTimeout(async () => {
    try {
      const seedType = process.env.SEED_TYPE || 'core';
      logger.info('Auto-seeding started', { seedType });
      await runSeeds(seedType);
    } catch (error) {
      logger.error('Auto-seeding failed', { error: error.message, seedType });
    }
  }, 2000);
}

// Middleware
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5000,http://127.0.0.1:5000,http://localhost:3000,http://127.0.0.1:3000')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);
const allowLocalhostWildcard = (process.env.ALLOW_LOCALHOST_WILDCARD || 'true').toLowerCase() === 'true';
const localhostRegex = /^http:\/\/(localhost|127\.0\.0\.1)(:\\d+)?$/;

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (allowLocalhostWildcard && localhostRegex.test(origin)) return callback(null, true);
    if (origin === 'null') return callback(null, true);
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET','HEAD','PUT','PATCH','POST','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.use(express.json());
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
}, express.static(path.join(__dirname, 'uploads')));
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Server is running", port: PORT, timestamp: new Date() });
});

// Debug notes endpoint
app.get('/api/debug-notes', async (req, res) => {
  try {
    const Image = require('./backend/src/models/image');
    const File = require('./backend/src/models/file');
    
    const images = await Image.find({}).limit(5).select('title notes');
    const files = await File.find({}).limit(5).select('title notes');
    
    res.json({ success: true, images, files });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Import and mount API routes
const imagesRoutes = require('./backend/src/routes/imagesRoutes');
const fileRoutes = require('./backend/src/routes/fileRoutes');
const authRoutes = require('./backend/src/routes/authRoutes');
const usersRoutes = require('./backend/src/routes/usersRoutes');
const superadminRoutes = require('./backend/src/routes/superadminRoutes');
const adminRoutes = require('./backend/src/routes/adminRoutes');
const analyticsRoutes = require('./backend/src/routes/analyticsRoutes');
const tenantRoutes = require('./backend/src/routes/tenantRoutes');
const tenantAnalyticsRoutes = require('./backend/src/routes/tenantAnalyticsRoutes');
const profileRoutes = require('./backend/src/routes/profileRoutes');
const Settings = require('./backend/src/models/settings');

// Mount resize endpoints before main images routes to prevent conflicts
app.use('/api/images', imagesRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/superadmin', superadminRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/tenant-analytics', tenantAnalyticsRoutes);
app.use('/api/notifications', require('./backend/src/routes/notificationRoutes'));
app.use('/api/activity', require('./backend/src/routes/activityRoutes'));

// Public settings endpoint (no auth) for theme/branding defaults
app.get('/api/settings', async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File too large. Max 2MB allowed."
      });
    }
    return res.status(400).json({ success: false, message: err.message });
  } else if (err.message.includes("File type not supported")) {
    return res.status(400).json({ success: false, message: err.message });
  }

  logger.error('Unhandled server error', { 
    error: err.message, 
    stack: err.stack,
    url: req?.url, 
    method: req?.method 
  });
  res.status(500).json({
    success: false,
    message: "Server error",
    error: err.message
  });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 JCMS Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔧 Debug notes: http://localhost:${PORT}/api/debug-notes`);
});

// Initialize WebSocket
const { initializeSocket } = require('./backend/src/services/socketService');
const io = initializeSocket(server);
global.io = io;

module.exports = app;