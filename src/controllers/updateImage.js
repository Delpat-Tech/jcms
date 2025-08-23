// controllers/updateImage.js
const Image = require('../models/image');
const { safeDeleteFile } = require('../utils/safeDeleteFile');
const { processImage } = require('../utils/imageProcessor');

const updateImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, subtitle, tenant, section } = req.body;
    const updatedData = { title, subtitle, tenant, section };

    // If a new file is uploaded...
    if (req.file) {
      // Delegate all file handling to the utility
      const { webpPath, avifPath, metadata } = await processImage(req.file, req.body);
      
      // Find the old image to delete its files
      const oldImage = await Image.findById(id);
      if (oldImage?.convertedFiles) {
        await Promise.all([
          safeDeleteFile(oldImage.convertedFiles.webp),
          safeDeleteFile(oldImage.convertedFiles.avif)
        ]);
      }

      // Add new file data to the update object
      updatedData.filePath = webpPath;
      updatedData.format = 'webp/avif';
      updatedData.width = metadata.width;
      updatedData.height = metadata.height;
      updatedData.convertedFiles = {
        webp: webpPath,
        avif: avifPath
      };
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