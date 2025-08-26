// controllers/createImage.js
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const Image = require('../models/image');
const { safeDeleteFile } = require('../utils/safeDeleteFile');

sharp.cache(false);

const createImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an image (JPG or PNG).' });
    }

    const { title, tenant } = req.body;

    if (req.body.notes) {
      try {
        req.body.notes = JSON.parse(req.body.notes);
      } catch (error) {
        return res.status(400).json({ success: false, error: "Invalid JSON format for notes" });
      }
    }

    // ✅ Allow jpg, png, webp, avif (default = webp)
    const allowedFormats = ['jpg', 'jpeg', 'png', 'webp', 'avif'];
    let chosenFormat = (req.body.format || 'webp').toLowerCase();
    if (!allowedFormats.includes(chosenFormat)) {
      chosenFormat = 'webp';
    }

    const uploadDir = path.dirname(req.file.path);
    const baseName = path.parse(req.file.filename).name;
    const imageBuffer = fs.readFileSync(req.file.path);

    // Define the output path with the chosen extension
    const outputPath = path.join(uploadDir, `${baseName}.${chosenFormat}`);

    // ✅ Process image based on format
    const sharpInstance = sharp(imageBuffer);
    if (chosenFormat === 'webp') {
      await sharpInstance.webp({ quality: 80 }).toFile(outputPath);
    } else if (chosenFormat === 'avif') {
      await sharpInstance.avif({ quality: 50 }).toFile(outputPath);
    } else if (chosenFormat === 'jpg' || chosenFormat === 'jpeg') {
      await sharpInstance.jpeg({ quality: 80 }).toFile(outputPath);
    } else if (chosenFormat === 'png') {
      await sharpInstance.png({ compressionLevel: 8 }).toFile(outputPath);
    }

    // Get metadata and delete the original upload
    const metadata = await sharp(outputPath).metadata();
    await safeDeleteFile(req.file.path);

    const relativePath = outputPath.replace(/\\/g, '/');
    const fileUrl = `${req.protocol}://${req.get('host')}/${relativePath}`;

    const newImage = await Image.create({
      title,
      tenant,
      filePath: outputPath.replace(/\\/g, '/'),
      fileUrl,
      format: chosenFormat,
      notes: req.body.notes || {},
    });

    res.status(201).json({
      success: true,
      message: `Image saved successfully as ${chosenFormat.toUpperCase()}`,
      data: newImage
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating image', error: error.message });
  }
};

module.exports = createImage;
