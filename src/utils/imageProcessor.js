// utils/imageProcessor.js
const path = require('path');
const fs = require('fs').promises; // Use promise-based fs
const sharp = require('sharp');
const { safeDeleteFile } = require('./safeDeleteFile');

sharp.cache(false);

const processImage = async (file, body) => {
  const { tenant, section } = body;
  const tempPath = file.path;

  // 1. Define final destination and create directory
  const finalDir = `uploads/${tenant}/${section}`;
  await fs.mkdir(finalDir, { recursive: true });

  // 2. Move file from temp to final destination
  const baseName = path.parse(file.filename).name;
  const originalExt = path.parse(file.filename).ext;
  const finalOriginalPath = path.join(finalDir, `${baseName}${originalExt}`);
  await fs.rename(tempPath, finalOriginalPath);

  // 3. Read moved file and convert to WebP and AVIF
  const imageBuffer = await fs.readFile(finalOriginalPath);
  
  const webpPath = path.join(finalDir, `${baseName}.webp`);
  const avifPath = path.join(finalDir, `${baseName}.avif`);

  await Promise.all([
    sharp(imageBuffer).webp({ quality: 80 }).toFile(webpPath),
    sharp(imageBuffer).avif({ quality: 50 }).toFile(avifPath)
  ]);

  // 4. Get metadata from the primary converted file (webp)
  const metadata = await sharp(webpPath).metadata();
  
  // 5. Clean up the moved original file (e.g., the .jpg or .png)
  await safeDeleteFile(finalOriginalPath);

  // 6. Return paths and metadata
  return {
    webpPath: webpPath.replace(/\\/g, '/'),
    avifPath: avifPath.replace(/\\/g, '/'),
    metadata
  };
};

module.exports = { processImage };