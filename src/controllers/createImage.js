const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const Image = require('../models/image');
const { safeDeleteFile } = require('../utils/safeDeleteFile');

sharp.cache(false); // Disable sharp cache

const createImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an image (JPG or PNG).' });
    }

    const { title, subtitle, tenant, section } = req.body;
    const uploadDir = path.dirname(req.file.path);
    const baseName = path.parse(req.file.filename).name;

    const imageBuffer = fs.readFileSync(req.file.path);

    const webpPath = path.join(uploadDir, `${baseName}.webp`);
    const avifPath = path.join(uploadDir, `${baseName}.avif`);

    await Promise.all([
      sharp(imageBuffer).webp({ quality: 80 }).toFile(webpPath),
      sharp(imageBuffer).avif({ quality: 50 }).toFile(avifPath)
    ]);

    const metadata = await sharp(webpPath).metadata();
    await safeDeleteFile(req.file.path);

    const newImage = await Image.create({
      title,
      subtitle,
      tenant,
      section,
      filePath: webpPath.replace(/\\/g, '/'),
      format: 'webp/avif',
      width: metadata.width,
      height: metadata.height,
      convertedFiles: {
        webp: webpPath.replace(/\\/g, '/'),
        avif: avifPath.replace(/\\/g, '/')
      }
    });

    res.status(201).json({
      success: true,
      message: 'Image converted & saved (only WebP/AVIF)',
      data: newImage
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating image', error: error.message });
  }
};

module.exports = createImage;
