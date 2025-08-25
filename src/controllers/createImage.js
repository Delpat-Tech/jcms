// controllers/createImage.js
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const Image = require('../models/image');
const { safeDeleteFile } = require('../utils/safeDeleteFile');

sharp.cache(false);

const createImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an image (JPG or PNG).' });
    }

    const { title, subtitle, tenant, section } = req.body;
    // Get the desired format from the body, default to 'webp'
    const chosenFormat = req.body.format === 'avif' ? 'avif' : 'webp'; 
    
    const uploadDir = path.dirname(req.file.path);
    const baseName = path.parse(req.file.filename).name;
    const imageBuffer = fs.readFileSync(req.file.path);

    // Define the output path with the correct extension
    const outputPath = path.join(uploadDir, `${baseName}.${chosenFormat}`);

    // Process the image to the chosen format
    const quality = chosenFormat === 'webp' ? 80 : 50;
    await sharp(imageBuffer)[chosenFormat]({ quality }).toFile(outputPath);

    // Get metadata and delete the original upload
    const metadata = await sharp(outputPath).metadata();
    await safeDeleteFile(req.file.path);

    const newImage = await Image.create({
      title,
      subtitle,
      tenant,
      section,
      filePath: outputPath.replace(/\\/g, '/'),
      format: chosenFormat,
      width: metadata.width,
      height: metadata.height
    });

    res.status(201).json({
      success: true,
      message: `Image saved successfully as ${chosenFormat.toUpperCase()}`,
      data: newImage
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating image', error: error.message });
  }
};

module.exports = createImage;