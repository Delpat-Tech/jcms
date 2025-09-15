const fs = require('fs');
const logger = require('../config/logger');

const safeDeleteFile = (filePath, retries = 5, delay = 100) => {
  return new Promise((resolve) => {
    const attemptDelete = (attempt = 1) => {
      fs.unlink(filePath, (err) => {
        if (err) {
          if (err.code === 'ENOENT') {
            resolve(true);
          } else if ((err.code === 'EBUSY' || err.code === 'EPERM') && attempt < retries) {
            setTimeout(() => attemptDelete(attempt + 1), delay);
          } else {
            logger.error('Error deleting file', { filePath, error: err.message, code: err.code, attempt });
            resolve(false);
          }
        } else {
          resolve(true);
        }
      });
    };
    attemptDelete();
  });
};

module.exports = { safeDeleteFile };
