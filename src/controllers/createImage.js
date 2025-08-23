// controllers/createImage.js
const Image = require('../models/image');
const { processImage } = require('../utils/imageProcessor');

const createImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an image (JPG or PNG).' });
    }

    // Corrected this line to use req.file and req.body
    const { webpPath, avifPath, metadata } = await processImage(req.file, req.body);

    const newImage = await Image.create({
      title: req.body.title,
      subtitle: req.body.subtitle,
      tenant: req.body.tenant,
      section: req.body.section,
      filePath: webpPath, // main file
      format: 'webp/avif',
      width: metadata.width,
      height: metadata.height,
      convertedFiles: {
        webp: webpPath,
        avif: avifPath
      }
    });

    res.status(201).json({
      success: true,
      message: 'Image converted & saved successfully',
      data: newImage
    });
  } catch (error) {
    // This will now catch errors from processImage as well
    res.status(500).json({ success: false, message: 'Error creating image', error: error.message });
  }
};

module.exports = createImage;