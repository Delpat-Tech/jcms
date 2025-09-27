// Migration script to convert single collection field to collections array
const mongoose = require('mongoose');
require('dotenv').config();

const Image = require('./src/models/image');

async function migrateCollections() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Find all images that have a collection but no collections array
    const imagesToMigrate = await Image.find({
      collection: { $exists: true, $ne: null },
      $or: [
        { collections: { $exists: false } },
        { collections: { $size: 0 } }
      ]
    });

    console.log(`Found ${imagesToMigrate.length} images to migrate`);

    let migratedCount = 0;
    for (const image of imagesToMigrate) {
      try {
        await Image.updateOne(
          { _id: image._id },
          { 
            $addToSet: { collections: image.collection }
          }
        );
        migratedCount++;
        
        if (migratedCount % 100 === 0) {
          console.log(`Migrated ${migratedCount} images...`);
        }
      } catch (error) {
        console.error(`Failed to migrate image ${image._id}:`, error.message);
      }
    }

    console.log(`Migration completed! Migrated ${migratedCount} out of ${imagesToMigrate.length} images`);
    
    // Verify migration
    const verifyCount = await Image.countDocuments({
      collection: { $exists: true, $ne: null },
      collections: { $exists: true, $not: { $size: 0 } }
    });
    
    console.log(`Verification: ${verifyCount} images now have both collection and collections fields`);

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateCollections();
}

module.exports = migrateCollections;