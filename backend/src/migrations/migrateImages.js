// migrations/migrateImages.js
const mongoose = require('mongoose');
const Image = require('../models/image');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const logger = require('../config/logger');

/**
 * Migration script to update existing images with new schema fields
 * This script is backward compatible and won't break existing functionality
 */

async function migrateImages() {
  try {
    console.log('Starting image migration...');
    
    // Find all images that don't have the new fields
    const imagesToMigrate = await Image.find({
      $or: [
        { filename: { $exists: false } },
        { visibility: { $exists: false } },
        { uploadDate: { $exists: false } },
        { metadata: { $exists: false } }
      ]
    });

    console.log(`Found ${imagesToMigrate.length} images to migrate`);

    let migrated = 0;
    let errors = 0;

    for (const image of imagesToMigrate) {
      try {
        const updateData = {};

        // Add filename if missing (extract from title or use default)
        if (!image.filename) {
          updateData.filename = image.title || 'unknown.jpg';
        }

        // Add visibility if missing (default to private)
        if (!image.visibility) {
          updateData.visibility = 'private';
        }

        // Add uploadDate if missing (use createdAt or current date)
        if (!image.uploadDate) {
          updateData.uploadDate = image.createdAt || new Date();
        }

        // Add metadata if missing and file exists
        if (!image.metadata && image.internalPath && fs.existsSync(image.internalPath)) {
          try {
            const imageInfo = await sharp(image.internalPath).metadata();
            updateData.metadata = {
              width: imageInfo.width,
              height: imageInfo.height,
              aspectRatio: imageInfo.width && imageInfo.height 
                ? `${imageInfo.width}:${imageInfo.height}` 
                : null,
              colorSpace: imageInfo.space,
              hasAlpha: imageInfo.hasAlpha,
              originalSize: image.fileSize || 0,
              compressionRatio: 1.0
            };
          } catch (metadataError) {
            console.warn(`Could not extract metadata for image ${image._id}:`, metadataError.message);
            updateData.metadata = {
              width: null,
              height: null,
              aspectRatio: null,
              colorSpace: null,
              hasAlpha: false,
              originalSize: image.fileSize || 0,
              compressionRatio: 1.0
            };
          }
        }

        // Add tags if missing (empty array)
        if (!image.tags) {
          updateData.tags = [];
        }

        // Add access tracking fields if missing
        if (image.accessCount === undefined) {
          updateData.accessCount = 0;
        }

        // Add versions array if missing
        if (!image.versions) {
          updateData.versions = [{
            format: image.format || 'unknown',
            size: image.fileSize || 0,
            path: image.internalPath || '',
            createdAt: image.createdAt || new Date()
          }];
        }

        // Update the image
        await Image.findByIdAndUpdate(image._id, updateData);
        migrated++;

        if (migrated % 10 === 0) {
          console.log(`Migrated ${migrated}/${imagesToMigrate.length} images...`);
        }

      } catch (error) {
        console.error(`Error migrating image ${image._id}:`, error.message);
        errors++;
      }
    }

    console.log(`Migration completed!`);
    console.log(`- Successfully migrated: ${migrated} images`);
    console.log(`- Errors: ${errors} images`);
    console.log(`- Total processed: ${imagesToMigrate.length} images`);

    return {
      success: true,
      migrated,
      errors,
      total: imagesToMigrate.length
    };

  } catch (error) {
    console.error('Migration failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Rollback migration (removes new fields)
 * Use with caution - this will remove the new functionality
 */
async function rollbackMigration() {
  try {
    console.log('Starting migration rollback...');
    
    const result = await Image.updateMany({}, {
      $unset: {
        filename: 1,
        project: 1,
        visibility: 1,
        uploadDate: 1,
        publicationDate: 1,
        cloudflareUrl: 1,
        cloudflareKey: 1,
        metadata: 1,
        tags: 1,
        accessCount: 1,
        lastAccessed: 1,
        versions: 1
      }
    });

    console.log(`Rollback completed. Modified ${result.modifiedCount} images.`);
    return {
      success: true,
      modified: result.modifiedCount
    };

  } catch (error) {
    console.error('Rollback failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Validate migration - check if all images have required fields
 */
async function validateMigration() {
  try {
    console.log('Validating migration...');

    const totalImages = await Image.countDocuments();
    
    const validImages = await Image.countDocuments({
      filename: { $exists: true },
      visibility: { $exists: true },
      uploadDate: { $exists: true },
      metadata: { $exists: true },
      tags: { $exists: true },
      accessCount: { $exists: true },
      versions: { $exists: true }
    });

    const invalidImages = totalImages - validImages;

    console.log(`Validation results:`);
    console.log(`- Total images: ${totalImages}`);
    console.log(`- Valid images: ${validImages}`);
    console.log(`- Invalid images: ${invalidImages}`);

    if (invalidImages === 0) {
      console.log('✅ All images have been successfully migrated!');
    } else {
      console.log('❌ Some images are missing required fields. Run migration again.');
    }

    return {
      success: true,
      total: totalImages,
      valid: validImages,
      invalid: invalidImages,
      isComplete: invalidImages === 0
    };

  } catch (error) {
    console.error('Validation failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// CLI interface
if (require.main === module) {
  const connectDB = require('../config/db');
  
  const command = process.argv[2];
  
  connectDB().then(async () => {
    try {
      switch (command) {
        case 'migrate':
          await migrateImages();
          break;
        case 'rollback':
          await rollbackMigration();
          break;
        case 'validate':
          await validateMigration();
          break;
        default:
          console.log('Usage:');
          console.log('  node migrateImages.js migrate   - Run migration');
          console.log('  node migrateImages.js rollback  - Rollback migration');
          console.log('  node migrateImages.js validate  - Validate migration');
      }
    } finally {
      process.exit(0);
    }
  }).catch(error => {
    console.error('Database connection failed:', error);
    process.exit(1);
  });
}

module.exports = {
  migrateImages,
  rollbackMigration,
  validateMigration
};
