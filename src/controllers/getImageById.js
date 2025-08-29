const Image = require('../models/image');

const getImageById = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenant;
    const image = await Image.findOne({ _id: id, tenant: tenantId });

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
