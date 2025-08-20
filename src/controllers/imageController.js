const Image = require('../models/image');
const { processAndSaveImage } = require('../services/imageService'); // <-- use your service

// POST /api/images OR /api/images/:section (see router notes below)
const createImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Image file is required (field name: 'image')" });
    }

    // Where do tenant/section come from?
    // Option A: section in URL param, tenant in body (recommended)
    const section = req.params.section || req.body.section || 'general';
    const tenant  = req.body.tenant || 'default';

    const title    = req.body.title || '';
    const subtitle = req.body.subtitle || '';

    // This service converts to AVIF + WebP, extracts width/height,
    // writes files under /uploads/{tenant}/{section}/, and saves to Mongo.
    const savedImages = await processAndSaveImage(
      req.file.buffer,
      tenant,
      section,
      title,
      subtitle,
      req.file.originalname
    );

    return res.status(201).json({
      success: true,
      message: 'Image processed & saved successfully',
      data: savedImages, // two docs: one AVIF, one WebP
    });
  } catch (error) {
    console.error('createImage error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating image',
      error: error.message,
    });
  }
};

// (Optional) will implement the rest when Im ready
const getImages = async (req, res) => {
  try {
    const { tenant, section } = req.query;
    const filter = {};
    if (tenant)  filter.tenant  = tenant;
    if (section) filter.section = section;

    const images = await Image.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, message: 'Images retrieved', data: images });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving images', error: error.message });
  }
};

const getImageById = async (req, res) => {
  try {
    const img = await Image.findById(req.params.id);
    if (!img) return res.status(404).json({ success: false, message: 'Not found' });
    res.status(200).json({ success: true, data: img });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving image', error: error.message });
  }
};

const updateImage = async (req, res) => {
  try {
    const updated = await Image.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Not found' });
    res.status(200).json({ success: true, message: 'Updated', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating image', error: error.message });
  }
};

const deleteImage = async (req, res) => {
  try {
    const deleted = await Image.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Not found' });
    res.status(200).json({ success: true, message: 'Deleted', data: deleted });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting image', error: error.message });
  }
};

module.exports = { createImage, getImages, getImageById, updateImage, deleteImage };
