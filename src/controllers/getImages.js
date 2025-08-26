// controllers/getImages.js
const Image = require('../models/image');

const getImages = async (req, res) => {
  try {
    // Get the logged-in user's ID from the auth middleware
    const userId = req.user.id;
    const { limit = 20, fields } = req.query;

    // The base filter now automatically scopes to the logged-in user
    const filter = { user: userId };

    // Handle field selection
    let projection = null;
    if (fields) {
      projection = fields.split(',').join(' ');
    }

    const images = await Image.find(filter, projection).limit(Number(limit));

    res.status(200).json({
      success: true,
      data: images
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving images', error: error.message });
  }
};

module.exports = getImages;