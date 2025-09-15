// src/utils/seedImage.js
require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Image = require("../models/image");
const logger = require('../config/logger');

const seedImage = async () => {
  await connectDB();

  try {
    const internalPath = "uploads/dummy.jpg";
    const fileUrl = `http://localhost:5000/${internalPath}`; // Example URL

    const img = await Image.create({
      title: "Dummy Banner",
      internalPath: internalPath,
      fileUrl: fileUrl,
      format: "jpg",
      tenant: "tenant123",
    });

    logger.debug('Dummy image inserted', { imageId: img._id, title: img.title, format: img.format });
  } catch (error) {
    logger.error('Error inserting dummy image', { error: error.message, stack: error.stack });
  } finally {
    mongoose.connection.close();
  }
};

seedImage();