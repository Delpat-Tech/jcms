// src/app.js
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const logger = require('./config/logger');

const app = express();

// --- CORS Configuration ---
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5000,http://127.0.0.1:5000,http://localhost:3000,http://127.0.0.1:3000,https://jackson-intellectual-native-assembly.trycloudflare.com,https://chemicals-happy-vinyl-presented.trycloudflare.com')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

const corsOptions = {
  // Use a function to dynamically check the origin
  origin: (origin, callback) => {
    // Allow requests with no origin (like Postman or mobile apps)
    if (!origin) return callback(null, true);
    
    // Check if the origin is in our allowed list
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET','HEAD','PUT','PATCH','POST','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','X-Requested-With'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// --- Static Asset Serving ---
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/public', express.static(path.join(__dirname, '../public')));
app.use('/docs', express.static(path.join(__dirname, '../docs')));
app.use(express.urlencoded({ extended: true }));


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
    message: "Server is running", 
    port: process.env.PORT || 5000, 
    timestamp: new Date() 
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


// --- CORRECTED: Catch-all route for SPA (React Router) ---
// Using a regex /.*/ to match all paths and avoid the PathError
app.get(/.*/, (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    // Let 404 errors for API routes be handled by the error handler
    return next();
  }
  // For all other routes, send the main HTML file
  res.sendFile(path.join(__dirname, '../public/index.html'));
});


// --- Global Error Handler ---
app.use((err, req, res, next) => {
  // Handle CORS errors specifically
  if (err.message === 'Not allowed by CORS') {
    logger.warn('CORS Error', { origin: req.header('Origin') });
    return res.status(403).json({
      success: false,
      message: 'CORS: This origin is not allowed to access resources.'
    });
  }
  
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File too large. Check subscription limits."
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