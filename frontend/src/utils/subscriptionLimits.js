// Frontend utility to check subscription limits
export const SUBSCRIPTION_LIMITS = {
  FREE: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxAdmins: 1,
    maxEditors: 1,
    fileExpirationDays: 15
  },
  SUBSCRIBED: {
    maxFileSize: 100 * 1024 * 1024, // 100MB
    maxAdmins: 1,
    maxEditors: 10,
    fileExpirationDays: null // No expiration
  }
};

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const checkFileSizeLimit = (file, hasActiveSubscription) => {
  const limits = hasActiveSubscription ? SUBSCRIPTION_LIMITS.SUBSCRIBED : SUBSCRIPTION_LIMITS.FREE;
  const maxSize = limits.maxFileSize;
  
  if (file.size > maxSize) {
    const maxSizeMB = Math.floor(maxSize / (1024 * 1024));
    const planType = hasActiveSubscription ? 'subscribed' : 'free';
    
    return {
      valid: false,
      error: `File size limit exceeded. ${planType} users can upload files up to ${maxSizeMB}MB. ${hasActiveSubscription ? '' : 'Upgrade to premium for 100MB limit.'}`
    };
  }
  
  return { valid: true };
};

export const checkUserCountLimit = (currentCount, role, hasActiveSubscription) => {
  const limits = hasActiveSubscription ? SUBSCRIPTION_LIMITS.SUBSCRIBED : SUBSCRIPTION_LIMITS.FREE;
  const maxCount = role === 'admin' ? limits.maxAdmins : limits.maxEditors;
  
  if (currentCount >= maxCount) {
    const planType = hasActiveSubscription ? 'subscribed' : 'free';
    
    return {
      valid: false,
      error: `${role} limit reached. ${planType} tenants can have up to ${maxCount} ${role}(s). ${hasActiveSubscription ? '' : 'Upgrade to premium for more users.'}`
    };
  }
  
  return { valid: true };
};

export const getFileExpirationInfo = (hasActiveSubscription) => {
  const limits = hasActiveSubscription ? SUBSCRIPTION_LIMITS.SUBSCRIBED : SUBSCRIPTION_LIMITS.FREE;
  
  if (limits.fileExpirationDays) {
    return {
      hasExpiration: true,
      days: limits.fileExpirationDays,
      message: `Files will be automatically deleted after ${limits.fileExpirationDays} days for free accounts.`
    };
  }
  
  return {
    hasExpiration: false,
    message: 'Files are stored permanently for subscribed accounts.'
  };
};

export const calculateExpirationDate = (uploadDate, hasActiveSubscription) => {
  const limits = hasActiveSubscription ? SUBSCRIPTION_LIMITS.SUBSCRIBED : SUBSCRIPTION_LIMITS.FREE;
  
  if (!limits.fileExpirationDays) {
    return null; // No expiration
  }
  
  const expirationDate = new Date(uploadDate);
  expirationDate.setDate(expirationDate.getDate() + limits.fileExpirationDays);
  return expirationDate;
};

export const getDaysUntilExpiration = (expirationDate) => {
  if (!expirationDate) return null;
  
  const now = new Date();
  const expiry = new Date(expirationDate);
  const diffTime = expiry - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

export const getExpirationStatus = (expirationDate) => {
  const daysLeft = getDaysUntilExpiration(expirationDate);
  
  if (daysLeft === null) {
    return { status: 'permanent', message: 'No expiration', color: 'green' };
  }
  
  if (daysLeft <= 0) {
    return { status: 'expired', message: 'Expired', color: 'red' };
  }
  
  if (daysLeft <= 3) {
    return { status: 'expiring-soon', message: `Expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`, color: 'orange' };
  }
  
  return { status: 'active', message: `Expires in ${daysLeft} days`, color: 'blue' };
};