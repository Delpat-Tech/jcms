// server.js
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, '../.env') });

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const connectDB = require("./config/db");
const { runSeeds } = require('./seeds');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
try {
  connectDB();
} catch (error) {
  console.error('❌ Database connection failed:', error.message);
  process.exit(1);
}

// Optional seeding on startup
if (process.env.AUTO_SEED === 'true') {
  setTimeout(async () => {
    try {
      const seedType = process.env.SEED_TYPE || 'core';
      console.log(`🌱 Auto-seeding with type: ${seedType}`);
      await runSeeds(seedType);
    } catch (error) {
      console.error('❌ Auto-seeding failed:', error.message);
    }
  }, 2000); // Wait 2 seconds for DB connection
}

// Middleware
app.use(express.json());
app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
app.use(express.urlencoded({ extended: true }));

// Dashboard routes (first)
app.get("/", (req, res) => {
  res.send("JCMS API Server - Use /api endpoints");
});

// Health check route
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Server is running" });
});

// Import and mount API routes
const imageRoutes = require('./routes/imageRoutes');
const authRoutes = require('./routes/authRoutes');
const usersRoutes = require('./routes/usersRoutes'); // Unified users API
const superadminRoutes = require('./routes/superadminRoutes');
const adminRoutes = require('./routes/adminRoutes');

app.use('/api/images', imageRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes); // Unified users API
app.use('/api/superadmin', superadminRoutes);
app.use('/api/admin', adminRoutes);

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
  } else if (err.message === "Only JPG and PNG files are allowed") {
    return res.status(400).json({ success: false, message: err.message });
  }

  // Fallback for other errors
  console.error(err);
  res.status(500).json({
    success: false,
    message: "Server error",
    error: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});