// seed.js - Seed Runner Script
const { runSeeds } = require('.');
const logger = require('../config/logger');

const main = async () => {
  const seedType = process.argv[2] || 'core';
  
  logger.info('Starting seed process', { seedType });
  
  try {
    await runSeeds(seedType);
    logger.info('All seeds completed successfully', { seedType });
  } catch (error) {
    logger.error('Seeding failed', { error: error.message, seedType, stack: error.stack });
    process.exit(1);
  }
};

main();