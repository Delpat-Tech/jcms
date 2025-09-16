// utils/tenantStorage.js
const fs = require('fs');
const path = require('path');
const { sanitizePath } = require('./pathSanitizer');

/**
 * Get tenant-specific storage path
 * @param {string} tenantId - Tenant ID
 * @param {string} userId - User ID (optional)
 * @param {string} fileType - File type (images, files, temp)
 * @returns {string} - Sanitized path
 */
const getTenantStoragePath = (tenantId, userId = null, fileType = 'files') => {
  const baseDir = 'uploads';
  const tenant = tenantId || 'system';
  
  let storagePath;
  if (userId) {
    storagePath = path.join(baseDir, tenant, fileType, userId);
  } else {
    storagePath = path.join(baseDir, tenant, fileType);
  }
  
  return sanitizePath(storagePath);
};

/**
 * Ensure tenant storage directory exists
 * @param {string} tenantId - Tenant ID
 * @param {string} userId - User ID (optional)
 * @param {string} fileType - File type
 */
const ensureTenantStorageExists = (tenantId, userId = null, fileType = 'files') => {
  const storagePath = getTenantStoragePath(tenantId, userId, fileType);
  
  if (!fs.existsSync(storagePath)) {
    fs.mkdirSync(storagePath, { recursive: true });
  }
  
  return storagePath;
};

/**
 * Get tenant storage statistics
 * @param {string} tenantId - Tenant ID
 * @returns {Object} - Storage statistics
 */
const getTenantStorageStats = (tenantId) => {
  const tenantPath = getTenantStoragePath(tenantId);
  
  if (!fs.existsSync(tenantPath)) {
    return {
      totalSize: 0,
      fileCount: 0,
      directories: 0
    };
  }

  const calculateDirSize = (dirPath) => {
    let totalSize = 0;
    let fileCount = 0;
    let directories = 0;

    try {
      const items = fs.readdirSync(dirPath);
      
      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stats = fs.statSync(itemPath);
        
        if (stats.isDirectory()) {
          directories++;
          const subStats = calculateDirSize(itemPath);
          totalSize += subStats.totalSize;
          fileCount += subStats.fileCount;
          directories += subStats.directories;
        } else {
          totalSize += stats.size;
          fileCount++;
        }
      }
    } catch (error) {
      // Directory access error - return zeros
    }

    return { totalSize, fileCount, directories };
  };

  return calculateDirSize(tenantPath);
};

/**
 * Clean up empty tenant directories
 * @param {string} tenantId - Tenant ID
 */
const cleanupEmptyTenantDirs = (tenantId) => {
  const tenantPath = getTenantStoragePath(tenantId);
  
  const removeEmptyDirs = (dirPath) => {
    try {
      if (!fs.existsSync(dirPath)) return;
      
      const items = fs.readdirSync(dirPath);
      
      // Recursively clean subdirectories
      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stats = fs.statSync(itemPath);
        
        if (stats.isDirectory()) {
          removeEmptyDirs(itemPath);
        }
      }
      
      // Check if directory is empty after cleanup
      const remainingItems = fs.readdirSync(dirPath);
      if (remainingItems.length === 0) {
        fs.rmdirSync(dirPath);
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  };

  removeEmptyDirs(tenantPath);
};

/**
 * Move files between tenants (for tenant reassignment)
 * @param {string} fromTenantId - Source tenant ID
 * @param {string} toTenantId - Destination tenant ID
 * @param {string} userId - User ID
 */
const moveTenantUserFiles = async (fromTenantId, toTenantId, userId) => {
  const sourcePath = getTenantStoragePath(fromTenantId, userId);
  const destPath = getTenantStoragePath(toTenantId, userId);
  
  if (!fs.existsSync(sourcePath)) {
    return { moved: 0, errors: [] };
  }
  
  // Ensure destination exists
  ensureTenantStorageExists(toTenantId, userId);
  
  const results = { moved: 0, errors: [] };
  
  const moveFiles = (srcDir, destDir) => {
    try {
      const items = fs.readdirSync(srcDir);
      
      for (const item of items) {
        const srcItem = path.join(srcDir, item);
        const destItem = path.join(destDir, item);
        const stats = fs.statSync(srcItem);
        
        if (stats.isDirectory()) {
          fs.mkdirSync(destItem, { recursive: true });
          moveFiles(srcItem, destItem);
        } else {
          fs.copyFileSync(srcItem, destItem);
          fs.unlinkSync(srcItem);
          results.moved++;
        }
      }
    } catch (error) {
      results.errors.push({
        path: srcDir,
        error: error.message
      });
    }
  };
  
  moveFiles(sourcePath, destPath);
  
  // Cleanup empty source directories
  cleanupEmptyTenantDirs(fromTenantId);
  
  return results;
};

/**
 * Delete all tenant files
 * @param {string} tenantId - Tenant ID
 */
const deleteTenantStorage = (tenantId) => {
  const tenantPath = getTenantStoragePath(tenantId);
  
  if (!fs.existsSync(tenantPath)) {
    return { deleted: 0, errors: [] };
  }
  
  const results = { deleted: 0, errors: [] };
  
  const deleteRecursive = (dirPath) => {
    try {
      const items = fs.readdirSync(dirPath);
      
      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stats = fs.statSync(itemPath);
        
        if (stats.isDirectory()) {
          deleteRecursive(itemPath);
          fs.rmdirSync(itemPath);
        } else {
          fs.unlinkSync(itemPath);
          results.deleted++;
        }
      }
    } catch (error) {
      results.errors.push({
        path: dirPath,
        error: error.message
      });
    }
  };
  
  deleteRecursive(tenantPath);
  
  // Remove tenant directory
  try {
    fs.rmdirSync(tenantPath);
  } catch (error) {
    results.errors.push({
      path: tenantPath,
      error: error.message
    });
  }
  
  return results;
};

/**
 * Get tenant quota usage
 * @param {string} tenantId - Tenant ID
 * @param {string} maxStorage - Max storage limit (e.g., "10GB")
 * @returns {Object} - Quota information
 */
const getTenantQuotaUsage = (tenantId, maxStorage = '10GB') => {
  const stats = getTenantStorageStats(tenantId);
  
  // Parse max storage
  const parseStorage = (storageStr) => {
    const units = {
      'B': 1,
      'KB': 1024,
      'MB': 1024 * 1024,
      'GB': 1024 * 1024 * 1024,
      'TB': 1024 * 1024 * 1024 * 1024
    };
    
    const match = storageStr.match(/^(\d+(?:\.\d+)?)\s*(B|KB|MB|GB|TB)$/i);
    if (!match) return 10 * 1024 * 1024 * 1024; // Default 10GB
    
    const value = parseFloat(match[1]);
    const unit = match[2].toUpperCase();
    
    return value * units[unit];
  };
  
  const maxBytes = parseStorage(maxStorage);
  const usedBytes = stats.totalSize;
  const usagePercentage = (usedBytes / maxBytes) * 100;
  
  return {
    used: usedBytes,
    max: maxBytes,
    available: maxBytes - usedBytes,
    usagePercentage: Math.round(usagePercentage * 100) / 100,
    isOverQuota: usedBytes > maxBytes,
    fileCount: stats.fileCount
  };
};

module.exports = {
  getTenantStoragePath,
  ensureTenantStorageExists,
  getTenantStorageStats,
  cleanupEmptyTenantDirs,
  moveTenantUserFiles,
  deleteTenantStorage,
  getTenantQuotaUsage
};