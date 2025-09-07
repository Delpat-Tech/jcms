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
  const imageTypes = /jpeg|jpg|png|gif|webp|bmp|tiff/;
  const documentTypes = /pdf|doc|docx|txt|rtf|odt/;
  const spreadsheetTypes = /xls|xlsx|ods|csv/;
  const presentationTypes = /ppt|pptx|odp/;
  
  const isImage = imageTypes.test(file.mimetype) || /\.(jpg|jpeg|png|gif|webp|bmp|tiff)$/i.test(file.originalname);
  const isDocument = documentTypes.test(file.mimetype) || /\.(pdf|doc|docx|txt|rtf|odt)$/i.test(file.originalname);
  const isSpreadsheet = spreadsheetTypes.test(file.mimetype) || /\.(xls|xlsx|ods|csv)$/i.test(file.originalname);
  const isPresentation = presentationTypes.test(file.mimetype) || /\.(ppt|pptx|odp)$/i.test(file.originalname);
  
  if (isImage || isDocument || isSpreadsheet || isPresentation) {
    cb(null, true);
  } else {
    cb(new Error('File type not supported. Allowed: images, PDF, Word, Excel, PowerPoint, text files'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB for documents
  fileFilter: fileFilter
});

module.exports = upload;