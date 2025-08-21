const path = require('path');
const fs = require('fs');
const sharp = require('sharp');   
const Image = require('../models/image');

/**
 * Create a new image
 */
const createImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an image (JPG or PNG).' });
    }

    const { title, subtitle, tenant, section } = req.body;
    const uploadDir = path.dirname(req.file.path);
    const baseName = path.parse(req.file.filename).name;

    // Convert to WebP
    const webpPath = path.join(uploadDir, `${baseName}.webp`);
    await sharp(req.file.path).webp({ quality: 80 }).toFile(webpPath);

    // Convert to AVIF
    const avifPath = path.join(uploadDir, `${baseName}.avif`);
    await sharp(req.file.path).avif({ quality: 50 }).toFile(avifPath);

    // Extract metadata from WebP
    const metadata = await sharp(webpPath).metadata();

    // Remove original uploaded file
    fs.unlinkSync(req.file.path);

    // Save to DB
    const newImage = await Image.create({
      title,
      subtitle,
      tenant,
      section,
      filePath: webpPath.replace(/\\/g, '/'), // main path = webp
      format: 'webp/avif',
      width: metadata.width,
      height: metadata.height,
      convertedFiles: {
        webp: webpPath.replace(/\\/g, '/'),
        avif: avifPath.replace(/\\/g, '/')
      }
    });

    res.status(201).json({
      success: true,
      message: 'Image converted & saved (only WebP/AVIF)',
      data: newImage
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating image', error: error.message });
  }
};

/**
 * Get all images with optional filtering
 */
const getImages = async (req, res) => {
  try {
    const { tenant, section } = req.query;

    const filter = {};
    if (tenant) filter.tenant = tenant;
    if (section) filter.section = section;

    const images = await Image.find(filter);

    res.status(200).json({
      success: true,
      message: 'Images retrieved successfully',
      data: images
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving images',
      error: error.message
    });
  }
};

/**
 * Get image by ID
 */
const getImageById = async (req, res) => {
  try {
    const { id } = req.params;

    const image = await Image.findById(id);
    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Image retrieved successfully',
      data: image
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving image',
      error: error.message
    });
  }
};

/**
 * Update image by ID
 */
const updateImage = async (req, res) => {
  try {
    const { id, section } = req.params;
    const { title, subtitle, tenant } = req.body;

    const updatedData = { title, subtitle, tenant, section };

    if (req.file) {
      const uploadDir = path.dirname(req.file.path);
      const baseName = path.parse(req.file.filename).name;

      // Convert to WebP
      const webpPath = path.join(uploadDir, `${baseName}.webp`);
      await sharp(req.file.path).webp({ quality: 80 }).toFile(webpPath);

      // Convert to AVIF
      const avifPath = path.join(uploadDir, `${baseName}.avif`);
      await sharp(req.file.path).avif({ quality: 50 }).toFile(avifPath);

      // Extract metadata
      const metadata = await sharp(webpPath).metadata();

      // Remove original uploaded file
      fs.unlinkSync(req.file.path);

      // Delete old converted files
      const oldImage = await Image.findById(id);
      if (oldImage?.convertedFiles) {
        Object.values(oldImage.convertedFiles).forEach(file => {
          if (fs.existsSync(file)) fs.unlinkSync(file);
        });
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

/**
 * Delete image by ID
 */
const deleteImage = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedImage = await Image.findByIdAndDelete(id);

    if (!deletedImage) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    // Delete files
    if (deletedImage.convertedFiles) {
      Object.values(deletedImage.convertedFiles).forEach(file => {
        if (fs.existsSync(file)) fs.unlinkSync(file);
      });
    }

    res.status(200).json({
      success: true,
      message: 'Image and files deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting image',
      error: error.message
    });
  }
};

module.exports = {
  createImage,
  getImages,
  getImageById,
  updateImage,
  deleteImage
};
