// controllers/createImage.js
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const Image = require('../models/image');
const { safeDeleteFile } = require('../utils/safeDeleteFile');

const createImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an image.' });
    }

    const { title } = req.body;
    const userId = req.user.id;
    const tenantId = req.user.tenant;

    if (req.body.notes) {
      try {
        req.body.notes = JSON.parse(req.body.notes);
      } catch (error) {
        await safeDeleteFile(req.file.path);
        return res.status(400).json({ success: false, error: "Invalid JSON format for notes" });
      }
    }

    const allowedFormats = ['jpg', 'jpeg', 'png', 'webp', 'avif'];
    let chosenFormat = (req.body.format || 'webp').toLowerCase();
    if (!allowedFormats.includes(chosenFormat)) chosenFormat = 'webp';
    if (chosenFormat === 'jpg') chosenFormat = 'jpeg';

    const uploadDir = `uploads/${tenantId}`;
    fs.mkdirSync(uploadDir, { recursive: true });

    const baseName = path.parse(req.file.originalname).name + '-' + Date.now();
    const imageBuffer = fs.readFileSync(req.file.path);
    await safeDeleteFile(req.file.path); // Delete the temporary multer upload

    // 👈 This is the line that defines outputPath
    const outputPath = path.join(uploadDir, `${baseName}.${chosenFormat}`);
    
    // Process image
    const sharpInstance = sharp(imageBuffer);
    if (chosenFormat === 'webp') await sharpInstance.webp({ quality: 80 }).toFile(outputPath);
    else if (chosenFormat === 'avif') await sharpInstance.avif({ quality: 50 }).toFile(outputPath);
    else if (chosenFormat === 'jpeg') await sharpInstance.jpeg({ quality: 80 }).toFile(outputPath);
    else if (chosenFormat === 'png') await sharpInstance.png({ compressionLevel: 8 }).toFile(outputPath);

    const internalPath = outputPath.replace(/\\/g, '/');
    const fileUrl = `${req.protocol}://${req.get('host')}/${internalPath}`;

    const newImage = await Image.create({
      title,
      user: userId,
      tenant: tenantId,
      internalPath,
      fileUrl,
      format: chosenFormat,
      notes: req.body.notes || {},
    });

    res.status(201).json({ success: true, data: newImage });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating image', error: error.message });
  }
};

module.exports = createImage;