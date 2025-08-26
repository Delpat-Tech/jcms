// controllers/genericPatch.js
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const Image = require('../models/image');
const { safeDeleteFile } = require('../utils/safeDeleteFile');

sharp.cache(false);

const genericPatch = async (req, res) => {
  try {
    const { id } = req.params;
    let { format } = req.body;

    if (!format) {
      return res.status(400).json({ success: false, message: 'No format provided to update' });
    }

    const existingImage = await Image.findById(id);
    if (!existingImage) {
      return res.status(404).json({ success: false, message: 'Image not found' });
    }
    
    format = format.toLowerCase();
    const oldPath = existingImage.internalPath;
    const uploadDir = path.dirname(oldPath);
    const baseName = path.parse(oldPath).name;
    const imageBuffer = fs.readFileSync(oldPath);
    const outputPath = path.join(uploadDir, `${baseName}.${format}`);

    await sharp(imageBuffer).toFormat(format, { quality: 80 }).toFile(outputPath);
    await safeDeleteFile(oldPath);

    const internalPath = outputPath.replace(/\\/g, '/');
    const updatedData = {
      internalPath,
      fileUrl: `${req.protocol}://${req.get('host')}/${internalPath}`,
      format,
    };

    const updatedImage = await Image.findByIdAndUpdate(id, updatedData, { new: true });
    res.status(200).json({ success: true, message: 'Image format updated successfully', data: updatedImage });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating image format', error: error.message });
  }
};

module.exports = genericPatch;