// src/controllers/userController.js
const User = require('../models/user');
const Image = require('../models/image');

// This function can be used for creating a user without password/auth logic
const createUser = async (req, res) => {
  try {
    const { username, email } = req.body;
    if (!username || !email) {
      return res.status(400).json({ success: false, message: 'Username and email are required.' });
    }
    const newUser = await User.create({ username, email });
    res.status(201).json({ success: true, data: newUser });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating user', error: error.message });
  }
};

// This function gets all images for a specific user ID from the URL
const getImagesByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const images = await Image.find({ user: userId });

    // Correctly handle cases where no images are found
    if (!images || images.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    res.status(200).json({ success: true, data: images });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving images', error: error.message });
  }
};

module.exports = {
  createUser,
  getImagesByUser
};