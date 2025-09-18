// utils/passwordPolicy.js

// Returns { valid: boolean, errors: string[], score: number }
const validatePassword = (password) => {
  const errors = [];
  let score = 0;

  if (typeof password !== 'string') {
    return { valid: false, errors: ['Password must be a string'], score: 0 };
  }

  if (password.length >= 8) score += 1; else errors.push('At least 8 characters');
  if (/[A-Z]/.test(password)) score += 1; else errors.push('At least one uppercase letter');
  if (/[a-z]/.test(password)) score += 1; else errors.push('At least one lowercase letter');
  if (/[0-9]/.test(password)) score += 1; else errors.push('At least one number');
  if (/[^A-Za-z0-9]/.test(password)) score += 1; else errors.push('At least one special character');

  return { valid: errors.length === 0, errors, score };
};

module.exports = { validatePassword };


