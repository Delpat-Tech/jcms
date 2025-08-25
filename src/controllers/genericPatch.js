// controllers/genericPatch.js
const Image = require('../models/image');

const genericPatch = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, tenant, notes } = req.body;

    // Prepare update object
    const updatedData = {};
    if (title) updatedData.title = title;
    if (tenant) updatedData.tenant = tenant;
    if (notes && typeof notes === 'object') updatedData.notes = notes;

    if (Object.keys(updatedData).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields provided to update' });
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

module.exports = genericPatch;
