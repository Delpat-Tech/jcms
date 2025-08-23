const Image = require('../models/image');
const { safeDeleteFile } = require('../utils/safeDeleteFile');

const deleteImage = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedImage = await Image.findByIdAndDelete(id);

    if (!deletedImage) {
      return res.status(404).json({ success: false, message: 'Image not found' });
    }

    if (deletedImage.convertedFiles) {
      const { webp, avif } = deletedImage.convertedFiles;
      await Promise.all([
        safeDeleteFile(webp),
        safeDeleteFile(avif)
      ]);
    }

    res.status(200).json({ success: true, message: 'Image and files deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting image', error: error.message });
  }
};

module.exports = deleteImage;
