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
    const { title, notes } = req.body;
    
    const existingImage = await Image.findById(id);
    if (!existingImage) {
      return res.status(404).json({ success: false, message: 'Image not found' });
    }

    // 🛡️ New Permission Logic:
    // Check if the user is an admin or the owner of the image.
    if (req.user.role !== 'admin' && existingImage.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this image' });
    }

    const updatedData = { title };

    if (notes) {
      try {
        updatedData.notes = typeof notes === 'string' ? JSON.parse(notes) : notes;
      } catch {
        return res.status(400).json({ success: false, message: 'Invalid JSON format for notes' });
      }
    }

    let chosenFormat = (req.body.format || existingImage.format).toLowerCase();
    
    const processImage = async (buffer, uploadDir, baseName) => {
      const outputPath = path.join(uploadDir, `${baseName}.${chosenFormat}`);
      await sharp(buffer).toFormat(chosenFormat, { quality: 80 }).toFile(outputPath);
      return outputPath.replace(/\\/g, '/');
    };

    if (req.file) {
      const tenantId = req.user.tenant;
      const uploadDir = `uploads/${tenantId}`; // Use tenant ID for folder
      fs.mkdirSync(uploadDir, { recursive: true }); // Ensure directory exists
      
      const baseName = path.parse(req.file.originalname).name + '-' + Date.now();
      const imageBuffer = fs.readFileSync(req.file.path);
      
      // Delete temp file
      await safeDeleteFile(req.file.path);
      
      // Delete old image
      if (existingImage.internalPath) await safeDeleteFile(existingImage.internalPath);

      const internalPath = await processImage(imageBuffer, uploadDir, baseName);
      updatedData.internalPath = internalPath;
      updatedData.fileUrl = `${req.protocol}://${req.get('host')}/${internalPath}`;
      updatedData.format = chosenFormat;

    } else if (chosenFormat !== existingImage.format) {
      // Re-processing logic if only format is changed
      const oldPath = existingImage.internalPath;
      const uploadDir = path.dirname(oldPath);
      const baseName = path.parse(oldPath).name;
      const imageBuffer = fs.readFileSync(oldPath);

      const internalPath = await processImage(imageBuffer, uploadDir, baseName);
      await safeDeleteFile(oldPath);

      updatedData.internalPath = internalPath;
      updatedData.fileUrl = `${req.protocol}://${req.get('host')}/${internalPath}`;
      updatedData.format = chosenFormat;
    }

    const updatedImage = await Image.findByIdAndUpdate(id, updatedData, { new: true });

    // Emit real-time event
    const realtime = req.app.get('realtime');
    if (realtime) {
      realtime.imageUpdated(req.user.tenant, {
        id: updatedImage._id,
        title: updatedImage.title,
        fileUrl: updatedImage.fileUrl
      }, {
        id: req.user.id,
        username: req.user.username
      });
    }

    res.status(200).json({ success: true, message: 'Image updated successfully', data: updatedImage });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating image', error: error.message });
  }
};

module.exports = updateImage;