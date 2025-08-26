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
  const allowedTypes = /jpeg|jpg|png/;
  if (allowedTypes.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG and PNG files are allowed'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: fileFilter
});

module.exports = upload;