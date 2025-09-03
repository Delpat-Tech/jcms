// seed.js - Seed Runner Script
const { runSeeds } = require('./src/seeds');

const main = async () => {
  const seedType = process.argv[2] || 'core';
  
  console.log(`🌱 Running ${seedType} seeds...`);
  
  try {
    await runSeeds(seedType);
    console.log('✅ All seeds completed successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
};

main();