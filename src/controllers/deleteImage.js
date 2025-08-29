// controllers/deleteImage.js
const Image = require('../models/image');
const { safeDeleteFile } = require('../utils/safeDeleteFile');

const deleteImage = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const tenantId = req.user.tenant;
    const role = req.user.role;

    // Find the image within tenant
    const image = await Image.findOne({ _id: id, tenant: tenantId });
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

    // Emit real-time event
    const realtime = req.app.get('realtime');
    if (realtime) {
      realtime.imageDeleted(req.user.tenant, {
        id: image._id,
        title: image.title
      }, {
        id: req.user.id,
        username: req.user.username
      });
    }

    res.status(200).json({ success: true, message: 'Image and file deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting image', error: error.message });
  }
};

module.exports = deleteImage;
