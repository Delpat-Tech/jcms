/**
 * Input validation utilities
 */

const validator = require('validator');

const validateEmail = (email) => {
  if (!email || !validator.isEmail(email)) {
    throw new Error('Invalid email format');
  }
  return validator.normalizeEmail(email);
};

const validateUsername = (username) => {
  if (!username || username.length < 3 || username.length > 30) {
    throw new Error('Username must be 3-30 characters');
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    throw new Error('Username can only contain letters, numbers, and underscores');
  }
  return username.toLowerCase();
};

const validatePassword = (password) => {
  if (!password || password.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }
  return password;
};

const sanitizeString = (str, maxLength = 255) => {
  if (!str) return '';
  return validator.escape(str.toString().trim().substring(0, maxLength));
};

const validateObjectId = (id) => {
  if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
    throw new Error('Invalid ID format');
  }
  return id;
};

module.exports = {
  validateEmail,
  validateUsername,
  validatePassword,
  sanitizeString,
  validateObjectId
};
