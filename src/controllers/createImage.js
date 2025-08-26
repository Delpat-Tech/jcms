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

    const { title, tenant } = req.body;

    if (req.body.notes) {
      try {
        req.body.notes = JSON.parse(req.body.notes);
      } catch (error) {
        return res.status(400).json({ success: false, error: "Invalid JSON format for notes" });
      }
    }


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

    const relativePath = outputPath.replace(/\\/g, '/');
    const fileUrl = `${req.protocol}://${req.get('host')}/${relativePath}`;

    const newImage = await Image.create({
      title,
      
      tenant,
      
      filePath: outputPath.replace(/\\/g, '/'),
      fileUrl:`${req.protocol}://${req.get('host')}/${relativePath}`,
      format: chosenFormat,
      notes: {},

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