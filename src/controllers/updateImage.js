const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const Image = require('../models/image');
const { safeDeleteFile } = require('../utils/safeDeleteFile');

sharp.cache(false);

const updateImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, subtitle, tenant, section } = req.body;
    const updatedData = { title, subtitle, tenant, section };

    if (req.file) {
      const uploadDir = path.dirname(req.file.path);
      const baseName = path.parse(req.file.filename).name;
      const imageBuffer = fs.readFileSync(req.file.path);

      const webpPath = path.join(uploadDir, `${baseName}.webp`);
      const avifPath = path.join(uploadDir, `${baseName}.avif`);

      await Promise.all([
        sharp(imageBuffer).webp({ quality: 80 }).toFile(webpPath),
        sharp(imageBuffer).avif({ quality: 50 }).toFile(avifPath)
      ]);

      const metadata = await sharp(webpPath).metadata();
      await safeDeleteFile(req.file.path);

      const oldImage = await Image.findById(id);
      if (oldImage?.convertedFiles) {
        await Promise.all([
          safeDeleteFile(oldImage.convertedFiles.webp),
          safeDeleteFile(oldImage.convertedFiles.avif)
        ]);
      }

      updatedData.filePath = webpPath.replace(/\\/g, '/');
      updatedData.format = 'webp/avif';
      updatedData.width = metadata.width;
      updatedData.height = metadata.height;
      updatedData.convertedFiles = {
        webp: webpPath.replace(/\\/g, '/'),
        avif: avifPath.replace(/\\/g, '/')
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
