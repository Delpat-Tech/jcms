// src/utils/seedImage.js
require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Image = require("../models/image");

const seedImage = async () => {
  await connectDB();

  try {
    const img = await Image.create({
      title: "Dummy Banner",             // required
      subtitle: "Test image for seeding",
      filePath: "/uploads/dummy.jpg",    // required
      width: 1920,
      height: 1080,
      format: "jpg",
      tenant: "tenant123",
      section: "homepage",
    });

    console.log("✅ Dummy Image Inserted:", img);
  } catch (error) {
    console.error("❌ Error inserting image:", error.message);
  } finally {
    mongoose.connection.close();
  }
};

seedImage();