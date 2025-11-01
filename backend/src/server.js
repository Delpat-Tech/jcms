// server.js
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, '../.env') });

const connectDB = require("./config/db");
const { runSeeds } = require('./seeds');
const logger = require('./config/logger');
const app = require('./app');

const PORT = parseInt(process.env.PORT) || 5000;

// Connect to MongoDB
connectDB().then(() => {
  logger.info('Database connected successfully');
}).catch((error) => {
  logger.error('Database connection failed', { error: error.message });
  process.exit(1);
});

// Optional seeding on startup (non-blocking)
if (process.env.AUTO_SEED === 'true') {
  setTimeout(async () => {
    try {
      const seedType = process.env.SEED_TYPE || 'core';
      logger.info('Auto-seeding started', { seedType });
      await runSeeds(seedType);
      logger.info('Auto-seeding completed', { seedType });
    } catch (error) {
      logger.error('Auto-seeding failed', { error: error.message, seedType });
      // Don't exit on seed failure, just log it
    }
  }, 3000); // Increased delay to ensure server starts first
}

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 JCMS Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔧 Debug notes: http://localhost:${PORT}/api/debug-notes`);
});

// Start image cleanup service
const { startCleanupSchedule } = require('./services/imageCleanupService');
startCleanupSchedule();
logger.info('Image cleanup service started');

// Initialize WebSocket
const { initializeSocket } = require('./services/socketService');
const io = initializeSocket(server);
global.io = io;

module.exports = app;