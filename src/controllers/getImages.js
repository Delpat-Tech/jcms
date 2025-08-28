// controllers/getImages.js
const Image = require('../models/image');

const getImages = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const userTenant = req.user.tenant;
    const { limit = 20, fields } = req.query;

    let filter = {};

    // Role-based filter
    if (userRole === "super-admin") {
      // Super admin sees all images
      filter = {};
    } else if (userRole === "admin") {
      // Admin sees all images from their tenant
      filter = { tenant: userTenant };
    } else {
      // Normal user sees only their own images
      filter = { user: userId };
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
