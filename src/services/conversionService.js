// services/conversionService.js
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const pdf = require('pdf-parse');

const convertFile = async (file, targetFormat) => {
  if (file.fileType === 'image') {
    return await convertImage(file, targetFormat);
  } else if (file.fileType === 'document') {
    return await convertDocument(file, targetFormat);
  } else {
    throw new Error('File type not supported for conversion');
  }
};

const convertImage = async (file, targetFormat) => {
  const validFormats = ['jpg', 'jpeg', 'png', 'webp', 'avif', 'tiff'];
  if (!validFormats.includes(targetFormat.toLowerCase())) {
    throw new Error(`Unsupported format: ${targetFormat}`);
  }

  const originalPath = file.internalPath;
  if (!fs.existsSync(originalPath)) {
    throw new Error('Original file not found');
  }

  const ext = `.${targetFormat.toLowerCase()}`;
  const newFilename = `${Date.now()}${ext}`;
  const newPath = path.join(path.dirname(originalPath), newFilename);

  let sharpInstance = sharp(originalPath);
  
  switch (targetFormat.toLowerCase()) {
    case 'jpg':
    case 'jpeg':
      await sharpInstance.jpeg({ quality: 90 }).toFile(newPath);
      break;
    case 'png':
      await sharpInstance.png().toFile(newPath);
      break;
    case 'webp':
      await sharpInstance.webp({ quality: 90 }).toFile(newPath);
      break;
    case 'avif':
      await sharpInstance.avif({ quality: 80 }).toFile(newPath);
      break;
    case 'tiff':
      await sharpInstance.tiff().toFile(newPath);
      break;
  }

  return {
    internalPath: newPath,
    fileUrl: file.fileUrl.replace(/[^/]+$/, newFilename),
    format: targetFormat.toLowerCase()
  };
};

const convertDocument = async (file, targetFormat) => {
  const validFormats = ['txt', 'rtf'];
  if (!validFormats.includes(targetFormat.toLowerCase())) {
    throw new Error(`Document conversion limited to: ${validFormats.join(', ')}`);
  }

  const originalPath = file.internalPath;
  if (!fs.existsSync(originalPath)) {
    throw new Error('Original file not found');
  }

  const ext = `.${targetFormat.toLowerCase()}`;
  const newFilename = `${Date.now()}${ext}`;
  const newPath = path.join(path.dirname(originalPath), newFilename);

  // Handle PDF to text conversion
  if (file.format === 'pdf' && targetFormat === 'txt') {
    const pdfBuffer = fs.readFileSync(originalPath);
    const data = await pdf(pdfBuffer);
    fs.writeFileSync(newPath, data.text, 'utf8');
    
    return {
      internalPath: newPath,
      fileUrl: file.fileUrl.replace(/[^/]+$/, newFilename),
      format: targetFormat.toLowerCase()
    };
  }
  
  // Simple text-based conversions
  if (file.format === 'txt' || file.format === 'rtf') {
    const content = fs.readFileSync(originalPath, 'utf8');
    
    if (targetFormat === 'txt') {
      // Strip RTF formatting if converting from RTF to TXT
      const cleanContent = content.replace(/\{[^}]*\}/g, '').replace(/\\[a-z]+\d*\s?/g, '');
      fs.writeFileSync(newPath, cleanContent, 'utf8');
    } else {
      // For RTF, add basic RTF headers if converting from TXT
      const rtfContent = file.format === 'txt' 
        ? `{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Times New Roman;}} \\f0\\fs24 ${content}}`
        : content;
      fs.writeFileSync(newPath, rtfContent, 'utf8');
    }

    return {
      internalPath: newPath,
      fileUrl: file.fileUrl.replace(/[^/]+$/, newFilename),
      format: targetFormat.toLowerCase()
    };
  }

  throw new Error('Only TXT and RTF conversions are supported');
};

module.exports = { convertFile };