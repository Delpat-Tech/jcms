// server.js
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, '../.env') });

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const connectDB = require("./config/db");
const { runSeeds } = require('./seeds');
const logger = require('./config/logger');

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
  }, 2000); // Wait 2 seconds for DB connection
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
    // Allow non-browser or same-origin requests (no Origin header)
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
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
app.use(express.urlencoded({ extended: true }));

// Dashboard routes (first)
app.get("/", (req, res) => {
  res.send("JCMS API Server - Use /api endpoints");
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'admin-panel.html'));
});

app.get("/admin-panel", (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'admin-panel.html'));
});

app.get("/admin-dashboard.html", (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'admin-dashboard.html'));
});

app.get("/test", (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'test-websocket.html'));
});

app.get("/test-websocket.html", (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'test-websocket.html'));
});

// (Test routes unchanged)

// Health check route
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Server is running", port: PORT, timestamp: new Date() });
});

// Simple ping endpoint
app.get("/ping", (req, res) => {
  res.json({ message: "pong", server: "JCMS", port: PORT });
});

// Logger test route
app.get("/api/test-logger", (req, res) => {
  logger.info('Logger test - INFO level', { test: true, timestamp: new Date() });
  logger.warn('Logger test - WARN level', { test: true });
  logger.error('Logger test - ERROR level', { test: true, error: 'This is a test error' });
  res.json({ success: true, message: 'Logger test completed - check console' });
});

// Debug login route
app.post("/api/debug-login", async (req, res) => {
  const User = require('./models/user');
  console.log('Request body:', req.body);
  console.log('Content-Type:', req.headers['content-type']);
  
  try {
    const users = await User.find().populate('role');
    res.json({ 
      receivedData: req.body,
      contentType: req.headers['content-type'],
      users: users.map(u => ({ email: u.email, username: u.username, role: u.role?.name }))
    });
  } catch (error) {
    res.json({ error: error.message, receivedData: req.body });
  }
});

// Test notification route
app.post("/api/test-notification", (req, res) => {
  const notification = {
    action: 'test_action',
    message: 'Test notification',
    timestamp: new Date(),
    data: {
      username: 'TestUser',
      resource: 'TestResource',
      userRole: 'admin',
      details: { ip: '127.0.0.1' },
      ...req.body
    }
  };
  
  console.log('Sending notification to', global.io.engine.clientsCount, 'clients');
  global.io.emit('admin_notification', notification);
  console.log('Notification sent:', notification);
  
  res.json({ success: true, message: 'Notification sent', clients: global.io.engine.clientsCount });
});

// Test activity tracking
app.post("/api/test-activity", async (req, res) => {
  try {
    const { notifyAdmins } = require('./services/socketService');
    
    // Simulate multiple activities
    for (let i = 0; i < 5; i++) {
      await notifyAdmins('test_upload', {
        userId: '507f1f77bcf86cd799439011',
        username: 'TestUser',
        resource: 'TestResource',
        resourceId: `test-${i}`,
        userRole: 'admin',
        details: { ip: '127.0.0.1', test: true }
      });
    }
    
    res.json({ success: true, message: 'Activity test completed' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Import and mount API routes
const imagesRoutes = require('./routes/imagesRoutes'); // Unified images API
const fileRoutes = require('./routes/fileRoutes'); // New file routes
const authRoutes = require('./routes/authRoutes');
const usersRoutes = require('./routes/usersRoutes'); // Unified users API
const superadminRoutes = require('./routes/superadminRoutes');
const adminRoutes = require('./routes/adminRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const tenantRoutes = require('./routes/tenantRoutes');
const tenantAnalyticsRoutes = require('./routes/tenantAnalyticsRoutes');
const profileRoutes = require('./routes/profileRoutes');

app.use('/api/images', imagesRoutes); // Unified images API for all roles
app.use('/api/files', fileRoutes); // New file API for all file types
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes); // Unified users API
app.use('/api/profile', profileRoutes); // User profile management
app.use('/api/superadmin', superadminRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/tenant-analytics', tenantAnalyticsRoutes);
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/activity', require('./routes/activityRoutes'));

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

  // Fallback for other errors
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
  console.log(`Server running on http://localhost:${PORT}`);
  logger.info('Server started successfully', { port: PORT });
});

// Initialize Socket.io - Simple setup
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  socket.join('admins');
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Global io for notifications
global.io = io;
