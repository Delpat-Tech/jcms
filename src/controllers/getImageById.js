const Image = require('../models/image');

const getImageById = async (req, res) => {
  try {
    const { id } = req.params;
    const image = await Image.findById(id);

    if (!image) {
      return res.status(404).json({ success: false, message: 'Image not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Image retrieved successfully',
      data: image
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving image', error: error.message });
  }
};

module.exports = getImageById;
