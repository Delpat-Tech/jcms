// controllers/genericPatch.js
const Image = require('../models/image');

const genericPatch = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.body) {
      return res.status(400).json({ success: false, message: 'Request body is missing' });
    }

    // Destructure form-data or JSON fields
    let { title, tenant, notes, metadata } = req.body;

    // Parse notes if sent as string (from form-data)
    if (notes && typeof notes === 'string') {
      try {
        notes = JSON.parse(notes);
      } catch (err) {
        return res.status(400).json({ success: false, message: 'Invalid JSON format for notes' });
      }
    }

    // Parse metadata if sent as string (from form-data)
    if (metadata && typeof metadata === 'string') {
      try {
        metadata = JSON.parse(metadata);
      } catch (err) {
        return res.status(400).json({ success: false, message: 'Invalid JSON format for metadata' });
      }
    }

    // Build the update object
    const updatedData = {};
    if (title) updatedData.title = title;
    if (tenant) updatedData.tenant = tenant;
    if (notes && typeof notes === 'object') updatedData.notes = notes;
    if (metadata && typeof metadata === 'object') updatedData.metadata = metadata;

    if (Object.keys(updatedData).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields provided to update' });
    }

    // Update the image in DB
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
    res.status(500).json({
      success: false,
      message: 'Error updating image',
      error: error.message
    });
  }
};

module.exports = genericPatch;
