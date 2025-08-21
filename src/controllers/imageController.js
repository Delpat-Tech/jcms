const Image = require('../models/image');
const sharp = require('sharp');

/**
 * Create a new image
 */
const createImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image (JPG or PNG).'
      });
    }

    const { title, subtitle, tenant, section } = req.body;

    // Use Sharp inside async function to get metadata
    const metadata = await sharp(req.file.path).metadata();

    // Create new image document
    const newImage = await Image.create({
      title,
      subtitle,
      tenant,
      section,
      filePath: req.file.path.replace(/\\/g, '/'), // normalize Windows path
      format: metadata.format, // jpeg, png, webp, etc.
      width: metadata.width,
      height: metadata.height
    });

    res.status(201).json({
      success: true,
      message: 'Image uploaded successfully',
      data: newImage
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating image',
      error: error.message
    });
  }
};


/**
 * Get all images with optional filtering
 */
const getImages = async (req, res) => {
  try {
    const { tenant, section } = req.query;

    // Build filter object
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
    const { id } = req.params;
    const { title, subtitle, tenant, section } = req.body;

    const updatedData = { title, subtitle, tenant, section };

    // If new image uploaded, update filePath & format
    if (req.file) {
      updatedData.filePath = req.file.path;
      updatedData.format = req.file.mimetype.split('/')[1];
      updatedData.width = null;   // Sharp will update later
      updatedData.height = null;
    }

    const updatedImage = await Image.findByIdAndUpdate(id, updatedData, { new: true });

    if (!updatedImage) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Image updated successfully',
      data: updatedImage
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating image',
      error: error.message
    });
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

    // Optional: delete the file from uploads folder
    // const fs = require('fs');
    // fs.unlinkSync(deletedImage.filePath);

    res.status(200).json({
      success: true,
      message: 'Image deleted successfully'
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
