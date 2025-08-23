const Image = require('../models/image');

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
    res.status(500).json({ success: false, message: 'Error retrieving images', error: error.message });
  }
};

module.exports = getImages;
