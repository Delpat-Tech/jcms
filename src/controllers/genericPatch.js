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
    const updateFields = req.body;

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ success: false, message: 'Request body is missing or empty' });
    }

    const existingImage = await Image.findById(id);
    if (!existingImage) {
      return res.status(404).json({ success: false, message: 'Image not found' });
    }

    // 🛡️ New Permission Logic:
    // Check if the user is an admin or the owner of the image.
    if (req.user.role !== 'admin' && existingImage.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this image' });
    }
    
    const dataToUpdate = {};
    if (updateFields.title) dataToUpdate.title = updateFields.title;
    if (updateFields.notes) dataToUpdate.notes = updateFields.notes;

    if (updateFields.format && updateFields.format.toLowerCase() !== existingImage.format) {
      const newFormat = updateFields.format.toLowerCase();
      const oldPath = existingImage.internalPath;
      const uploadDir = path.dirname(oldPath);
      const baseName = path.parse(oldPath).name;
      const imageBuffer = fs.readFileSync(oldPath);

      const newPath = path.join(uploadDir, `${baseName}.${newFormat}`);
      await sharp(imageBuffer).toFormat(newFormat, { quality: 80 }).toFile(newPath);
      await safeDeleteFile(oldPath);
      
      dataToUpdate.format = newFormat;
      dataToUpdate.internalPath = newPath.replace(/\\/g, '/');
      dataToUpdate.fileUrl = `${req.protocol}://${req.get('host')}/${dataToUpdate.internalPath}`;
    }

    if (Object.keys(dataToUpdate).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields provided to update' });
    }

    const updatedImage = await Image.findByIdAndUpdate(id, dataToUpdate, { new: true });

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