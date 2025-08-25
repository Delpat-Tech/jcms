// controllers/updateImage.js
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const Image = require('../models/image');
const { safeDeleteFile } = require('../utils/safeDeleteFile');

sharp.cache(false);

const updateImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, tenant } = req.body;
    const updatedData = { title, tenant };

    if (req.file) {
      const chosenFormat = req.body.format === 'avif' ? 'avif' : 'webp';
      const uploadDir = path.dirname(req.file.path);
      const baseName = path.parse(req.file.filename).name;
      const imageBuffer = fs.readFileSync(req.file.path);

      // Delete the old file first
      const oldImage = await Image.findById(id);
      if (oldImage?.filePath) {
        await safeDeleteFile(oldImage.filePath);
      }

      // Process the new file
      const outputPath = path.join(uploadDir, `${baseName}.${chosenFormat}`);
      const quality = chosenFormat === 'webp' ? 80 : 50;
      await sharp(imageBuffer)[chosenFormat]({ quality }).toFile(outputPath);

      const metadata = await sharp(outputPath).metadata();
      await safeDeleteFile(req.file.path);

      // Add new file data to the update object
      updatedData.filePath = outputPath.replace(/\\/g, '/');
      const fileUrl = `${req.protocol}://${req.get('host')}/${relativePath}`;
      updatedData.format = chosenFormat;

    }

    const updatedImage = await Image.findByIdAndUpdate(id, updatedData, { new: true });

    if (!updatedImage) {
      return res.status(404).json({ success: false, message: 'Image not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Image updated successfully',
      data: updatedImage
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating image', error: error.message });
  }
};

module.exports = updateImage;