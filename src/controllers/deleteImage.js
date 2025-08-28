// controllers/deleteImage.js
const Image = require('../models/image');
const { safeDeleteFile } = require('../utils/safeDeleteFile');

const deleteImage = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const role = req.user.role; // admin, editor, viewer, etc.

    // Find the image
    const image = await Image.findById(id);
    if (!image) {
      return res.status(404).json({ success: false, message: 'Image not found' });
    }

    // Permission logic:
    // - Admin → can delete any image
    // - Others → can only delete their own
    if (role !== 'admin' && image.user.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this image' });
    }

    // Delete from DB
    await image.deleteOne();

    // Delete file from storage if exists
    if (image.internalPath) {
      await safeDeleteFile(image.internalPath);
    }

    res.status(200).json({ success: true, message: 'Image and file deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting image', error: error.message });
  }
};

module.exports = deleteImage;
