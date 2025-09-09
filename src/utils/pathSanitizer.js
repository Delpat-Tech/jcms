// utils/pathSanitizer.js
const path = require('path');

const sanitizePath = (inputPath, baseDir = 'uploads') => {
  if (!inputPath || typeof inputPath !== 'string') {
    throw new Error('Invalid path input');
  }
  
  // Normalize and resolve the path
  const normalizedPath = path.normalize(inputPath);
  const resolvedPath = path.resolve(normalizedPath);
  const resolvedBaseDir = path.resolve(baseDir);
  
  // Ensure the resolved path is within the base directory
  if (!resolvedPath.startsWith(resolvedBaseDir)) {
    throw new Error('Path traversal attempt detected');
  }
  
  return normalizedPath;
};

const sanitizeFilename = (filename) => {
  if (!filename || typeof filename !== 'string') {
    throw new Error('Invalid filename');
  }
  
  // Remove path separators and dangerous characters
  return filename.replace(/[/\\:*?"<>|]/g, '_').replace(/\.\./g, '_');
};

module.exports = { sanitizePath, sanitizeFilename };