// services/fileService.js
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const getFileType = (mimetype, filename) => {
  const imageTypes = /image\/(jpeg|jpg|png|gif|webp|bmp|tiff)/;
  const documentTypes = /application\/(pdf|msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document)|text\/(plain|rtf)/;
  const spreadsheetTypes = /application\/(vnd\.ms-excel|vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet|vnd\.oasis\.opendocument\.spreadsheet)|text\/csv/;
  const presentationTypes = /application\/(vnd\.ms-powerpoint|vnd\.openxmlformats-officedocument\.presentationml\.presentation|vnd\.oasis\.opendocument\.presentation)/;
  
  if (imageTypes.test(mimetype) || /\.(jpg|jpeg|png|gif|webp|bmp|tiff)$/i.test(filename)) {
    return 'image';
  } else if (documentTypes.test(mimetype) || /\.(pdf|doc|docx|txt|rtf|odt)$/i.test(filename)) {
    return 'document';
  } else if (spreadsheetTypes.test(mimetype) || /\.(xls|xlsx|ods|csv)$/i.test(filename)) {
    return 'spreadsheet';
  } else if (presentationTypes.test(mimetype) || /\.(ppt|pptx|odp)$/i.test(filename)) {
    return 'presentation';
  }
  return 'text';
};

const processFile = async (file, tenant, section) => {
  const fileType = getFileType(file.mimetype, file.originalname);
  const ext = path.extname(file.originalname).toLowerCase();
  
  // Create destination directory
  const destDir = path.join('uploads', tenant, section);
  fs.mkdirSync(destDir, { recursive: true });
  
  if (fileType === 'image') {
    // Process images with Sharp (convert to AVIF)
    const filename = `${Date.now()}.avif`;
    const destPath = path.join(destDir, filename);
    
    await sharp(file.path)
      .avif({ quality: 80 })
      .toFile(destPath);
    
    return {
      internalPath: destPath,
      fileUrl: `/uploads/${tenant}/${section}/${filename}`,
      format: 'avif',
      fileType
    };
  } else {
    // For documents, just move the file
    const filename = `${Date.now()}${ext}`;
    const destPath = path.join(destDir, filename);
    
    fs.renameSync(file.path, destPath);
    
    return {
      internalPath: destPath,
      fileUrl: `/uploads/${tenant}/${section}/${filename}`,
      format: ext.substring(1),
      fileType
    };
  }
};

module.exports = { getFileType, processFile };