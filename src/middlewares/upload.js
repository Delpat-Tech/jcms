// middlewares/upload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // 1. Save all uploads to a single temporary directory first.
    const tempPath = 'uploads/temp';
    fs.mkdirSync(tempPath, { recursive: true });
    cb(null, tempPath);
  },
  filename: (req, file, cb) => {
    // Use a unique filename
    const ext = path.extname(file.originalname);
    const filename = `image-${Date.now()}${ext}`;
    cb(null, filename);
  }
});

// File type validation (allow only JPG/PNG)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png/;
  if (allowedTypes.test(file.mimetype)) {
    cb(null, true);
  } else {
    // Use a specific error object for better handling downstream
    const err = new Error('Only JPG and PNG files are allowed');
    err.code = 'INVALID_FILE_TYPE';
    cb(err);
  }
};

// Export multer instance
const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: fileFilter
});

module.exports = upload;