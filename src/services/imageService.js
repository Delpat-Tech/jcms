// services/imageService.js
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const IMAGE_SIZES = {
  thumbnail: { width: 300, suffix: '_thumb' },
  medium: { width: 720, suffix: '_med' },
  large: { width: 1080, suffix: '_large' }
};

const generateMultipleSizes = async (inputBuffer, outputDir, baseName, format = 'webp') => {
  const results = {};
  
  // Create output directory if it doesn't exist
  fs.mkdirSync(outputDir, { recursive: true });
  
  // Generate each size
  for (const [sizeName, config] of Object.entries(IMAGE_SIZES)) {
    const outputPath = path.join(outputDir, `${baseName}${config.suffix}.${format}`);
    
    const sharpInstance = sharp(inputBuffer).resize(config.width, null, {
      fit: 'inside'
    });
    
    // Apply format-specific compression
    if (format === 'webp') await sharpInstance.webp({ quality: 80 }).toFile(outputPath);
    else if (format === 'avif') await sharpInstance.avif({ quality: 50 }).toFile(outputPath);
    else if (format === 'jpeg') await sharpInstance.jpeg({ quality: 80 }).toFile(outputPath);
    else if (format === 'png') await sharpInstance.png({ compressionLevel: 8 }).toFile(outputPath);
    
    results[sizeName] = {
      path: outputPath.replace(/\\/g, '/'),
      width: config.width
    };
  }
  
  return results;
};

const convertImageFormat = async (inputPath, outputFormat) => {
  const allowedFormats = ['webp', 'avif', 'jpeg', 'png'];
  if (!allowedFormats.includes(outputFormat)) {
    throw new Error(`Invalid format. Allowed: ${allowedFormats.join(', ')}`);
  }
  
  const inputBuffer = fs.readFileSync(inputPath);
  const outputDir = path.dirname(inputPath);
  const baseName = path.parse(inputPath).name;
  const outputPath = path.join(outputDir, `${baseName}.${outputFormat}`);
  
  const sharpInstance = sharp(inputBuffer);
  
  if (outputFormat === 'webp') await sharpInstance.webp({ quality: 80 }).toFile(outputPath);
  else if (outputFormat === 'avif') await sharpInstance.avif({ quality: 50 }).toFile(outputPath);
  else if (outputFormat === 'jpeg') await sharpInstance.jpeg({ quality: 80 }).toFile(outputPath);
  else if (outputFormat === 'png') await sharpInstance.png({ compressionLevel: 8 }).toFile(outputPath);
  
  return outputPath.replace(/\\/g, '/');
};

module.exports = {
  generateMultipleSizes,
  convertImageFormat,
  IMAGE_SIZES
};