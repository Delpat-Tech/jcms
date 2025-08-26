// controllers/genericPatch.js
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const Image = require('../models/image');
const { safeDeleteFile } = require('../utils/safeDeleteFile');

sharp.cache(false);

const formatOptions = {
  jpeg: { quality: 80 },
  png: { compressionLevel: 9 },
  webp: { quality: 80 },
  avif: { quality: 50 },
};

const genericPatch = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.body) {
      return res.status(400).json({ success: false, message: 'Request body is missing' });
    }

    let { format } = req.body;

    // Fetch existing image
    const existingImage = await Image.findById(id);
    if (!existingImage) {
      return res.status(404).json({ success: false, message: 'Image not found' });
    }

    // Initialize update object
    const updatedData = {};

    // Process format conversion if provided
    if (format) {
      format = format.toLowerCase();
      if (format === 'jpg') format = 'jpeg';
      const allowedFormats = ['webp', 'avif', 'jpeg', 'png'];
      if (!allowedFormats.includes(format)) {
        return res.status(400).json({ success: false, message: 'Invalid format provided' });
      }

      const oldPath = existingImage.filePath;
      const uploadDir = path.dirname(oldPath);
      const baseName = path.parse(oldPath).name;
      const imageBuffer = fs.readFileSync(oldPath);

      const outputPath = path.join(uploadDir, `${baseName}.${format}`);

      // Convert image
      await sharp(imageBuffer)
        .toFormat(format, formatOptions[format])
        .toFile(outputPath);

      // Delete old file safely
      await safeDeleteFile(oldPath);

      const relativePath = outputPath.replace(/\\/g, '/');
      updatedData.filePath = relativePath;
      updatedData.fileUrl = `${req.protocol}://${req.get('host')}/${relativePath}`;
      updatedData.format = format;
    }

    if (Object.keys(updatedData).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields provided to update' });
    }

    const updatedImage = await Image.findByIdAndUpdate(id, updatedData, { new: true });

    res.status(200).json({
      success: true,
      message: 'Image updated successfully',
      data: updatedImage,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating image',
      error: error.message,
    });
  }
};

module.exports = genericPatch;
