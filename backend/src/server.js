// server.js
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, '../.env') });

const connectDB = require("./config/db");
const { runSeeds } = require('./seeds');
const logger = require('./config/logger');
const app = require('./app');

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

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 JCMS Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔧 Debug notes: http://localhost:${PORT}/api/debug-notes`);
});

// Initialize WebSocket
const { initializeSocket } = require('./services/socketService');
const io = initializeSocket(server);
global.io = io;

module.exports = app;