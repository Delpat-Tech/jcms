const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const logger = require('./config/logger');

const app = express();

// Middleware setup
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5000,http://127.0.0.1:5000,http://localhost:3000,http://127.0.0.1:3000')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);
const allowLocalhostWildcard = (process.env.ALLOW_LOCALHOST_WILDCARD || 'true').toLowerCase() === 'true';
const localhostRegex = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

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
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Serve public files for Cloudflare Tunnel
app.use('/public', express.static(path.join(__dirname, '../public')));
app.use(express.urlencoded({ extended: true }));

// Health check routes
app.get("/api/health", (req, res) => {
  res.status(200).json({ 
    message: "Server is running", 
    port: process.env.PORT || 5000, 
    timestamp: new Date() 
  });
});

app.get('/api/debug-notes', async (req, res) => {
  try {
    const Image = require('./models/image');
    const File = require('./models/file');
    
    const images = await Image.find({}).limit(5).select('title notes');
    const files = await File.find({}).limit(5).select('title notes');
    
    res.json({ success: true, images, files });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// API Routes
app.use('/api/images', require('./routes/imagesRoutes'));
app.use('/api/image-management', require('./routes/imageManagementRoutes'));
app.use('/api/files', require('./routes/fileRoutes'));
app.use('/api/content', require('./routes/contentRoutes'));
// Public content routes (no auth)
app.use('/public', require('./routes/publicContentRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/usersRoutes'));
app.use('/api/profile', require('./routes/profileRoutes'));
app.use('/api/superadmin', require('./routes/superadminRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/tenants', require('./routes/tenantRoutes'));
app.use('/api/tenant-analytics', require('./routes/tenantAnalyticsRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/activity', require('./routes/activityRoutes'));
app.use('/api/tenant-switching', require('./routes/tenantSwitchingRoutes'));
app.use('/api/editor', require('./routes/editorRoutes'));
app.use('/api/help', require('./routes/helpRoutes'));
app.use('/api/subscriptions', require('./routes/subscriptionRoutes'));

// Public settings endpoint
app.get('/api/settings', async (req, res) => {
  try {
    const Settings = require('./models/settings');
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

module.exports = app;