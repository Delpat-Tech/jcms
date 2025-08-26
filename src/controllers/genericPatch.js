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

    // Check for an empty request body
    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ success: false, message: 'Request body is missing or empty' });
    }

    // Fetch the existing image from the database
    const existingImage = await Image.findById(id);
    if (!existingImage) {
      return res.status(404).json({ success: false, message: 'Image not found' });
    }

    // This object will hold all the fields to be updated in the database
    const dataToUpdate = {};

    // Handle standard metadata fields
    if (updateFields.title) dataToUpdate.title = updateFields.title;
    if (updateFields.tenant) dataToUpdate.tenant = updateFields.tenant;
    if (updateFields.notes) dataToUpdate.notes = updateFields.notes; // No need to parse, it's already JSON

    // Handle format conversion if 'format' is provided and is different
    if (updateFields.format && updateFields.format.toLowerCase() !== existingImage.format) {
      const newFormat = updateFields.format.toLowerCase();
      const oldPath = existingImage.internalPath;
      const uploadDir = path.dirname(oldPath);
      const baseName = path.parse(oldPath).name;
      const imageBuffer = fs.readFileSync(oldPath);

      // Create the new file
      const newPath = path.join(uploadDir, `${baseName}.${newFormat}`);
      await sharp(imageBuffer).toFormat(newFormat, { quality: 80 }).toFile(newPath);

      // Delete the old file
      await safeDeleteFile(oldPath);
      
      // Add the new file info to our update object
      dataToUpdate.format = newFormat;
      dataToUpdate.internalPath = newPath.replace(/\\/g, '/');
      dataToUpdate.fileUrl = `${req.protocol}://${req.get('host')}/${dataToUpdate.internalPath}`;
    }

    // Check if there's anything to update
    if (Object.keys(dataToUpdate).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields provided to update' });
    }

    // Perform the update in the database
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