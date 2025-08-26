// src/utils/seedImage.js
require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Image = require("../models/image");

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

    console.log("✅ Dummy Image Inserted:", img);
  } catch (error) {
    console.error("❌ Error inserting image:", error.message);
  } finally {
    mongoose.connection.close();
  }
};

seedImage();