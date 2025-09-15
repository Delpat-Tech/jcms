// services/fileService.js
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const getFileType = (mimetype, filename) => {
  const ext = path.extname(filename).toLowerCase();
  
  // Image types
  if (mimetype.startsWith('image/') || ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff', '.svg', '.ico'].includes(ext)) {
    return 'image';
  }
  
  // Document types
  if (mimetype.includes('pdf') || ext === '.pdf') return 'document';
  if (mimetype.includes('word') || ['.doc', '.docx'].includes(ext)) return 'document';
  if (mimetype.includes('text') || ['.txt', '.rtf', '.md'].includes(ext)) return 'document';
  if (['.odt', '.pages'].includes(ext)) return 'document';
  
  // Spreadsheet types
  if (mimetype.includes('sheet') || ['.xls', '.xlsx', '.csv', '.ods'].includes(ext)) return 'spreadsheet';
  
  // Presentation types
  if (mimetype.includes('presentation') || ['.ppt', '.pptx', '.odp', '.key'].includes(ext)) return 'presentation';
  
  // Video types
  if (mimetype.startsWith('video/') || ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv'].includes(ext)) return 'video';
  
  // Audio types
  if (mimetype.startsWith('audio/') || ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.wma'].includes(ext)) return 'audio';
  
  // Archive types
  if (['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2'].includes(ext)) return 'archive';
  
  // Code types
  if (['.js', '.html', '.css', '.json', '.xml', '.sql', '.py', '.java', '.cpp', '.c', '.php'].includes(ext)) return 'code';
  
  // Default for any other file
  return 'other';
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