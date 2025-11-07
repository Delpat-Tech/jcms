const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const logger = require('./config/logger');

const app = express();

// --- CORS Configuration ---
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5000,http://localhost:3000')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// --- Static Asset Serving ---
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/public', express.static(path.join(__dirname, '../public')));
app.use('/docs', express.static(path.join(__dirname, '../docs')));


// --- Public API Routes (No Auth Required) ---
app.use('/api/public', require('./routes/publicContentRoutes'));
app.use('/public', require('./routes/publicContentRoutes')); // Legacy alias


// --- Core API Routes ---
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/usersRoutes'));
app.use('/api/profile', require('./routes/profileRoutes'));
app.use('/api/tenants', require('./routes/tenantRoutes'));
app.use('/api/tenant-branding', require('./routes/tenantBrandingRoutes'));
app.use('/api/tenant-analytics', require('./routes/tenantAnalyticsRoutes'));
app.use('/api/tenant-switching', require('./routes/tenantSwitchingRoutes'));
app.use('/api/subscription', require('./routes/subscriptionRoutes'));

// --- Content & Media Routes ---
app.use('/api/images', require('./routes/imagesRoutes'));
app.use('/api/image-management', require('./routes/imageManagementRoutes'));
app.use('/api/files', require('./routes/fileRoutes'));
app.use('/api/content', require('./routes/contentRoutes'));
app.use('/api/json-documents', require('./routes/jsonDocumentRoutes'));

// --- Admin & System Routes ---
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/superadmin', require('./routes/superadminRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/activity', require('./routes/activityRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/editor', require('./routes/editorRoutes'));
app.use('/api/help', require('./routes/helpRoutes'));
app.use('/api/cleanup', require('./routes/cleanupRoutes'));

// --- Health Check ---
app.get("/api/health", (req, res) => {
  res.status(200).json({ 
    success: true,
    message: "Server is running", 
    port: process.env.PORT || 5000, 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// --- Settings Route ---
app.get('/api/settings', async (req, res) => {
  try {
    const Settings = require('./models/settings');
    const settings = await Settings.getSettings();
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


// --- SPA Catch-all (must be last) ---
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      message: 'API endpoint not found',
      path: req.path
    });
  }
  res.sendFile(path.join(__dirname, '../public/index.html'));
});


// --- Global Error Handler ---
app.use((err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') {
    logger.warn('CORS Error', { origin: req.header('Origin') });
    return res.status(403).json({
      success: false,
      message: 'CORS: Origin not allowed'
    });
  }
  
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File too large"
      });
    }
    return res.status(400).json({ success: false, message: err.message });
  }

  if (err.message?.includes("File type not supported")) {
    return res.status(400).json({ success: false, message: err.message });
  }

  logger.error('Server error', { 
    error: err.message, 
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.url, 
    method: req.method 
  });
  
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Server error' : err.message
  });
});

module.exports = app;