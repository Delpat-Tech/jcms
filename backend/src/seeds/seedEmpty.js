// src/seeds/seedEmpty.js
const mongoose = require('mongoose');
const seedCore = require('./seedCore');
const logger = require('../config/logger');
require('dotenv').config();

const seedEmpty = async () => {
  try {
    logger.info('Starting empty seeding (minimal)');
    
    // Only run core seeding (roles, permissions, SuperAdmin)
    const result = await seedCore();
    
    logger.info('Empty seeding completed successfully', { 
      seededData: ['Roles and permissions', 'SuperAdmin user'] 
    });
    
    return result;
    
  } catch (error) {
    logger.error('Empty seeding failed', { error: error.message, stack: error.stack });
    throw error;
  }
};

module.exports = seedEmpty;