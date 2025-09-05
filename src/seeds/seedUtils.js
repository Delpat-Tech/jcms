// src/seeds/seedUtils.js
const mongoose = require('mongoose');

const seedUtils = {
  // Check if document exists
  async exists(Model, query) {
    return await Model.findOne(query);
  },

  // Create if not exists
  async createIfNotExists(Model, data, uniqueField = 'name') {
    const existing = await Model.findOne({ [uniqueField]: data[uniqueField] });
    if (existing) {
      console.log(`ℹ️ ${Model.modelName} '${data[uniqueField]}' already exists`);
      return existing;
    }
    
    const created = await Model.create(data);
    console.log(`✅ ${Model.modelName} '${data[uniqueField]}' created`);
    return created;
  },

  // Bulk create with duplicate handling
  async bulkCreateIfNotExists(Model, dataArray, uniqueField = 'name') {
    const results = [];
    for (const data of dataArray) {
      const result = await this.createIfNotExists(Model, data, uniqueField);
      results.push(result);
    }
    return results;
  },

  // Drop collection if exists
  async dropCollection(collectionName) {
    try {
      await mongoose.connection.db.dropCollection(collectionName);
      console.log(`🗑️ Dropped collection: ${collectionName}`);
    } catch (error) {
      if (error.code === 26) { // Collection doesn't exist
        console.log(`ℹ️ Collection ${collectionName} doesn't exist, skipping drop`);
      } else {
        throw error;
      }
    }
  },

  // Get collection stats
  async getStats(Model) {
    const count = await Model.countDocuments();
    return { model: Model.modelName, count };
  }
};

module.exports = seedUtils;