// createAdmin.js
const mongoose = require('mongoose');
require('dotenv').config(); // Load .env
const User = require('./src/models/user'); // Adjust path if needed

const createAdmin = async () => {
  try {
    // 1️⃣ Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const username = "superadmin";
    const email = "super@example.com";
    const plainPassword = "super123"; 
    const role = "admin";

    // 2️⃣ Check if admin already exists
    const existingAdmin = await User.findOne({ email });
    if (existingAdmin) {
      console.log("Admin already exists!");
      console.log(existingAdmin);
      return process.exit(0);
    }

    // 3️⃣ Create admin WITHOUT manually hashing the password
    const admin = await User.create({
      username,
      email,
      password: plainPassword, // pre('save') will hash this automatically
      role,
    });

    console.log("Admin created successfully:", admin);
    process.exit(0);

  } catch (error) {
    console.error("Error creating admin:", error);
    process.exit(1);
  }
};

createAdmin();
