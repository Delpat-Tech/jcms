// middlewares/upload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Save all initial uploads to a single temporary directory
    const tempPath = 'uploads/temp';
    fs.mkdirSync(tempPath, { recursive: true });
    cb(null, tempPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `temp-${Date.now()}${ext}`;
    cb(null, filename);
  }
});

const fileFilter = (req, file, cb) => {
  // Accept any file type - no restrictions
  cb(null, true);
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB for any file type
  fileFilter: fileFilter
});

// Support multiple files in single 'file' field
const uploadMultipleInSingleField = upload.array('file', 10);

module.exports = upload;
module.exports.uploadMultipleInSingleField = uploadMultipleInSingleField;