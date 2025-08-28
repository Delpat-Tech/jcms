// controllers/getImages.js
const Image = require('../models/image');

const getImages = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { limit = 20, fields } = req.query;

    let filter = {};

    // 🛡️ New Permission Logic:
    // If the user is an admin, the filter is empty (gets all images).
    // Otherwise, the filter is set to only find images owned by the user.
    if (userRole !== 'admin') {
      filter.user = userId;
    }

    // Handle field selection
    let projection = null;
    if (fields) {
      projection = fields.split(',').join(' ');
    }

    const images = await Image.find(filter, projection).limit(Number(limit));

    res.status(200).json({
      success: true,
      count: images.length,
      data: images,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving images",
      error: error.message,
    });
  }
};

module.exports = getImages;