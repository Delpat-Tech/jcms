// services/cloudflareR2Service.js
const fs = require('fs');
const path = require('path');
const logger = require('../config/logger');

// Try to import AWS SDK modules, but gracefully handle if not installed
let S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, getSignedUrl, mime;

try {
  const s3 = require('@aws-sdk/client-s3');
  const presigner = require('@aws-sdk/s3-request-presigner');
  S3Client = s3.S3Client;
  PutObjectCommand = s3.PutObjectCommand;
  DeleteObjectCommand = s3.DeleteObjectCommand;
  GetObjectCommand = s3.GetObjectCommand;
  HeadObjectCommand = s3.HeadObjectCommand;
  getSignedUrl = presigner.getSignedUrl;
  mime = require('mime-types');
} catch (error) {
  logger.warn('AWS SDK modules not installed. Cloudflare R2 functionality will be disabled. Run: npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner mime-types');
}

class CloudflareR2Service {
  constructor() {
    this.client = null;
    this.bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME;
    this.publicDomain = process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN;
    this.initializeClient();
  }

  initializeClient() {
    try {
      if (!S3Client) {
        logger.warn('AWS SDK not available. Cloudflare R2 service will be disabled.');
        return;
      }

      if (!process.env.CLOUDFLARE_R2_ACCOUNT_ID || 
          !process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || 
          !process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY ||
          !this.bucketName) {
        logger.warn('Cloudflare R2 configuration incomplete. Service will be disabled.');
        return;
      }

      this.client = new S3Client({
        region: 'auto',
        endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
          secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
        },
      });

      logger.info('Cloudflare R2 client initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Cloudflare R2 client', { error: error.message });
    }
  }

  isConfigured() {
    return this.client !== null;
  }

  /**
   * Upload file to Cloudflare R2
   * @param {string} filePath - Local file path
   * @param {string} key - R2 object key
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<Object>} Upload result with public URL
   */
  async uploadFile(filePath, key, metadata = {}) {
    if (!this.isConfigured()) {
      throw new Error('Cloudflare R2 is not configured');
    }

    try {
      const fileBuffer = fs.readFileSync(filePath);
      const contentType = mime ? mime.lookup(filePath) || 'application/octet-stream' : 'application/octet-stream';
      
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: contentType,
        Metadata: {
          originalName: metadata.originalName || path.basename(filePath),
          uploadedBy: metadata.userId || 'system',
          tenant: metadata.tenant || 'system',
          uploadDate: new Date().toISOString(),
          ...metadata
        }
      });

      const result = await this.client.send(command);
      
      const publicUrl = this.publicDomain 
        ? `https://${this.publicDomain}/${key}`
        : `https://${this.bucketName}.${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`;

      logger.info('File uploaded to Cloudflare R2', { 
        key, 
        size: fileBuffer.length,
        contentType 
      });

      return {
        success: true,
        key,
        publicUrl,
        etag: result.ETag,
        size: fileBuffer.length,
        contentType
      };
    } catch (error) {
      logger.error('Failed to upload file to Cloudflare R2', { 
        error: error.message, 
        key,
        filePath 
      });
      throw error;
    }
  }

  /**
   * Upload buffer to Cloudflare R2
   * @param {Buffer} buffer - File buffer
   * @param {string} key - R2 object key
   * @param {string} contentType - MIME type
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<Object>} Upload result with public URL
   */
  async uploadBuffer(buffer, key, contentType, metadata = {}) {
    if (!this.isConfigured()) {
      throw new Error('Cloudflare R2 is not configured');
    }

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        Metadata: {
          uploadedBy: metadata.userId || 'system',
          tenant: metadata.tenant || 'system',
          uploadDate: new Date().toISOString(),
          ...metadata
        }
      });

      const result = await this.client.send(command);
      
      const publicUrl = this.publicDomain 
        ? `https://${this.publicDomain}/${key}`
        : `https://${this.bucketName}.${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`;

      logger.info('Buffer uploaded to Cloudflare R2', { 
        key, 
        size: buffer.length,
        contentType 
      });

      return {
        success: true,
        key,
        publicUrl,
        etag: result.ETag,
        size: buffer.length,
        contentType
      };
    } catch (error) {
      logger.error('Failed to upload buffer to Cloudflare R2', { 
        error: error.message, 
        key 
      });
      throw error;
    }
  }

  /**
   * Delete file from Cloudflare R2
   * @param {string} key - R2 object key
   * @returns {Promise<boolean>} Success status
   */
  async deleteFile(key) {
    if (!this.isConfigured()) {
      throw new Error('Cloudflare R2 is not configured');
    }

    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.client.send(command);
      logger.info('File deleted from Cloudflare R2', { key });
      return true;
    } catch (error) {
      logger.error('Failed to delete file from Cloudflare R2', { 
        error: error.message, 
        key 
      });
      return false;
    }
  }

  /**
   * Check if file exists in Cloudflare R2
   * @param {string} key - R2 object key
   * @returns {Promise<boolean>} Existence status
   */
  async fileExists(key) {
    if (!this.isConfigured()) {
      return false;
    }

    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.client.send(command);
      return true;
    } catch (error) {
      if (error.name === 'NotFound') {
        return false;
      }
      logger.error('Error checking file existence in Cloudflare R2', { 
        error: error.message, 
        key 
      });
      return false;
    }
  }

  /**
   * Generate presigned URL for temporary access
   * @param {string} key - R2 object key
   * @param {number} expiresIn - Expiration time in seconds (default: 1 hour)
   * @returns {Promise<string>} Presigned URL
   */
  async generatePresignedUrl(key, expiresIn = 3600) {
    if (!this.isConfigured()) {
      throw new Error('Cloudflare R2 is not configured');
    }

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const presignedUrl = await getSignedUrl(this.client, command, { expiresIn });
      return presignedUrl;
    } catch (error) {
      logger.error('Failed to generate presigned URL', { 
        error: error.message, 
        key 
      });
      throw error;
    }
  }

  /**
   * Generate unique key for file storage
   * @param {string} userId - User ID
   * @param {string} tenantId - Tenant ID
   * @param {string} filename - Original filename
   * @param {string} format - File format
   * @returns {string} Unique storage key
   */
  generateKey(userId, tenantId, filename, format) {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const baseName = path.parse(sanitizedFilename).name;
    
    return `images/${tenantId || 'system'}/${userId}/${timestamp}-${randomSuffix}-${baseName}.${format}`;
  }

  /**
   * Get file metadata from R2
   * @param {string} key - R2 object key
   * @returns {Promise<Object>} File metadata
   */
  async getFileMetadata(key) {
    if (!this.isConfigured()) {
      throw new Error('Cloudflare R2 is not configured');
    }

    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const result = await this.client.send(command);
      return {
        size: result.ContentLength,
        contentType: result.ContentType,
        lastModified: result.LastModified,
        etag: result.ETag,
        metadata: result.Metadata || {}
      };
    } catch (error) {
      logger.error('Failed to get file metadata from Cloudflare R2', { 
        error: error.message, 
        key 
      });
      throw error;
    }
  }
}

module.exports = new CloudflareR2Service();
