// middlewares/upload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');
// For PATCH request

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Folder structure: uploads/{tenant}/{section}/
    const tenant = req.body.tenant || 'default';
    const section = req.body.section || 'index';
    const folderPath = `uploads/${tenant}/${section}`;

    // Create folder if it doesn't exist
    fs.mkdirSync(folderPath, { recursive: true });

    cb(null, folderPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname); // get file extension
    const filename = `image-${Date.now()}${ext}`; // e.g., image-1692534567890.jpg
    cb(null, filename);
  }
});

// File type validation (allow only JPG/PNG)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png/;
  if (allowedTypes.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG and PNG files are allowed'));
  }
};

// Export multer instance
const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: fileFilter
});

module.exports = upload;
