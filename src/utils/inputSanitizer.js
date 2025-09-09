// utils/inputSanitizer.js
const sanitizeForLog = (input) => {
  if (typeof input === 'string') {
    return encodeURIComponent(input).replace(/[^\w\-_.~]/g, '_');
  }
  if (typeof input === 'object' && input !== null) {
    return JSON.stringify(input).replace(/[^\w\-_.~{}":,\[\]]/g, '_');
  }
  return String(input).replace(/[^\w\-_.~]/g, '_');
};

const validateAndSanitizeInput = (input, maxLength = 1000) => {
  if (!input) return input;
  
  if (typeof input === 'string') {
    return input.slice(0, maxLength).trim();
  }
  
  return input;
};

module.exports = { sanitizeForLog, validateAndSanitizeInput };