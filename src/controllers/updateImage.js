// controllers/updateImage.js
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const Image = require('../models/image');
const { safeDeleteFile } = require('../utils/safeDeleteFile');

sharp.cache(false);

const formatQualityMap = {
  avif: 50,
  png: 100,
  webp: 80,
  jpeg: 80,
};

const updateImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, tenant, notes } = req.body;
    const updatedData = { title, tenant };

    // Parse notes if provided
    if (notes) {
      try {
        updatedData.notes = typeof notes === 'string' ? JSON.parse(notes) : notes;
      } catch {
        return res.status(400).json({
          success: false,
          message: 'Invalid JSON format for notes',
        });
      }
    }

    // Fetch existing image
    const existingImage = await Image.findById(id);
    if (!existingImage) {
      return res.status(404).json({ success: false, message: 'Image not found' });
    }

    // Determine desired format
    const allowedFormats = ['webp', 'avif', 'jpeg', 'jpg', 'png'];
    let chosenFormat = (req.body.format || existingImage.format).toLowerCase();
    if (!allowedFormats.includes(chosenFormat)) chosenFormat = 'webp';
    if (chosenFormat === 'jpg') chosenFormat = 'jpeg';
    const quality = formatQualityMap[chosenFormat] || 80;

    const processImage = async (buffer, uploadDir, baseName) => {
      const outputPath = path.join(uploadDir, `${baseName}.${chosenFormat}`);
      await sharp(buffer).toFormat(chosenFormat, { quality }).toFile(outputPath);
      return outputPath.replace(/\\/g, '/');
    };

    // Handle new file upload
    if (req.file) {
      const uploadDir = path.dirname(req.file.path);
      const baseName = path.parse(req.file.filename).name;
      const imageBuffer = fs.readFileSync(req.file.path);

      if (existingImage.filePath) await safeDeleteFile(existingImage.filePath);

      const relativePath = await processImage(imageBuffer, uploadDir, baseName);
      updatedData.filePath = relativePath;
      updatedData.fileUrl = `${req.protocol}://${req.get('host')}/${relativePath}`;
      updatedData.format = chosenFormat;
    } 
    // Reprocess existing file if format changed
    else if (chosenFormat !== existingImage.format) {
      const oldPath = existingImage.filePath;
      const uploadDir = path.dirname(oldPath);
      const baseName = path.parse(oldPath).name;
      const imageBuffer = fs.readFileSync(oldPath);

      const relativePath = await processImage(imageBuffer, uploadDir, baseName);
      await safeDeleteFile(oldPath);

      updatedData.filePath = relativePath;
      updatedData.fileUrl = `${req.protocol}://${req.get('host')}/${relativePath}`;
      updatedData.format = chosenFormat;
    }

    // Update document
    const updatedImage = await Image.findByIdAndUpdate(id, updatedData, { new: true });

    res.status(200).json({
      success: true,
      message: 'Image updated successfully',
      data: updatedImage,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating image', error: error.message });
  }
};

module.exports = updateImage;
