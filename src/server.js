// server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer"); // 👈 needed for error type check
const connectDB = require("./config/db");

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB(); // Commented out for testing routes

// Middleware
app.use(express.json());
app.use(cors());
app.use('/uploads', express.static('uploads'));

// Routes
const imageRoutes = require('./routes/imageRoutes');

// Health check route
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Server is running" });
});

// Image routes
app.use('/api/images', imageRoutes);

// Example route
app.get("/", (req, res) => {
  res.send("Hello World!");
});

// 🛑 Global error handler (Multer + others)
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Multer-specific errors
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File too large. Max 2MB allowed."
      });
    }
    return res.status(400).json({ success: false, message: err.message });
  } else if (err.message === "Only JPG and PNG files are allowed") {
    // Invalid file type
    return res.status(400).json({ success: false, message: err.message });
  }

  // Fallback: general errors
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
