require('dotenv').config();
const mongoose = require('mongoose');
const Image = require('./src/models/image');
const File = require('./src/models/file');

async function clearMockData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    // Check for images
    const images = await Image.find({});
    console.log(`Found ${images.length} images`);
    
    // Check for files
    const files = await File.find({});
    console.log(`Found ${files.length} files`);
    
    if (images.length > 0) {
      await Image.deleteMany({});
      console.log('All images deleted');
    }
    
    if (files.length > 0) {
      await File.deleteMany({});
      console.log('All files deleted');
    }
    
    console.log('Mock data cleared successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

clearMockData();