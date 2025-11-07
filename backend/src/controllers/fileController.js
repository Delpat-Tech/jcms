// controllers/fileController.js
const File = require('../models/file');
const { processFile } = require('../services/fileService');
const { convertFile } = require('../services/conversionService');
const { processJsonFile } = require('../services/jsonProcessingService');
const { sanitizePath } = require('../utils/pathSanitizer');
const { sanitizeForLog } = require('../utils/inputSanitizer');
const fs = require('fs');

const uploadFile = async (req, res) => {
  try {
    // Handle multiple files in 'file' field, 'files' array, or single file
    let files = [];
    if (req.files && Array.isArray(req.files)) {
      files = req.files;
    } else if (req.file) {
      files = [req.file];
    }
    
    if (files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }

    // Check file size limits based on subscription
    if (req.subscriptionLimits) {
      const maxFileSize = req.subscriptionLimits.maxFileSize;
      const oversizedFiles = files.filter(file => file.size > maxFileSize);
      
      if (oversizedFiles.length > 0) {
        const maxSizeMB = Math.floor(maxFileSize / (1024 * 1024));
        const planType = req.hasActiveSubscription ? 'subscribed' : 'free';
        
        return res.status(400).json({
          success: false,
          message: `File size limit exceeded. ${planType} users can upload files up to ${maxSizeMB}MB. ${req.hasActiveSubscription ? '' : 'Upgrade to premium for 100MB limit.'}`,
          oversizedFiles: oversizedFiles.map(f => ({ name: f.originalname, size: f.size }))
        });
      }
    }

    const uploadedFiles = [];
    
    for (const file of files) {
      if (!file) continue;

      const { title, notes, section = 'general' } = req.body;
      const tenantPath = req.user.tenant ? req.user.tenant._id.toString() : 'system';
      
      console.log('File upload data:', { title, notes, tenantPath, section });
      console.log('Creating file with notes:', notes);

      const processedFile = await processFile(file, tenantPath, section);
      const fileTitle = processedFile.format === 'json' ? file.originalname : (title || file.originalname);
    
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const fullFileUrl = `${baseUrl}${processedFile.fileUrl}`;
    
      const fileData = {
        title: fileTitle,
        user: req.user.id,
        tenant: req.user.tenant?._id || null,
        tenantName: req.user.tenant ? req.user.tenant.name : 'System',
        originalName: file.originalname,
        fileSize: file.size,
        notes: processedFile.format === 'json' ? {} : (notes || ''),
        fileUrl: fullFileUrl,
        publicUrl: fullFileUrl,
        internalPath: processedFile.internalPath,
        fileType: processedFile.fileType,
        format: processedFile.format
      };

      // Set expiration for free tenants
      if (req.subscriptionLimits && req.subscriptionLimits.fileExpirationDays) {
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + req.subscriptionLimits.fileExpirationDays);
        fileData.expiresAt = expirationDate;
      }

      const newFile = new File(fileData);

      await newFile.save();
      
      // Process JSON files automatically
      let jsonProcessingResult = null;
      if (processedFile.format === 'json') {
        jsonProcessingResult = await processJsonFile(
          newFile, 
          req.user, 
          req.user.tenant?._id || null,
          req.body.collection || null
        );
      }
      
      // Clean up temp file
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }

      const fileResult = {
        ...newFile.toObject(),
        fullUrl: `${baseUrl}${processedFile.fileUrl}`
      };
      
      if (jsonProcessingResult) {
        fileResult.jsonProcessing = jsonProcessingResult;
      }
      
      uploadedFiles.push(fileResult);
    }

    // Format file size helper
    const formatFileSize = (bytes) => {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    };

    // Aggregate response with unique fields only
    const totalSizeBytes = uploadedFiles.reduce((sum, f) => sum + f.fileSize, 0);
    const summary = {
      totalFiles: uploadedFiles.length,
      fileTypes: [...new Set(uploadedFiles.map(f => f.fileType))],
      formats: [...new Set(uploadedFiles.map(f => f.format))],
      totalSize: formatFileSize(totalSizeBytes)
    };

    const compactFiles = uploadedFiles.map(file => ({
      id: file._id,
      title: file.title,
      originalName: file.originalName,
      fileType: file.fileType,
      format: file.format,
      fileSize: file.fileSize, // Keep as number for frontend formatting
      fileSizeFormatted: formatFileSize(file.fileSize),
      fullUrl: file.fullUrl
    }));

    res.status(201).json({
      success: true,
      message: `${uploadedFiles.length} file(s) uploaded successfully`,
      summary,
      files: compactFiles
    });
  } catch (error) {
    // Clean up temp files on error
    const files = req.files || [req.file];
    if (files) {
      files.forEach(file => {
        if (file && fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

const getFilesByType = async (req, res) => {
  try {
    const { type } = req.params;
    
    let filter = { fileType: type };
    if (req.user.role.name === 'superadmin') {
      // Superadmin can see all files
    } else if (req.user.role.name === 'admin') {
      // Admin can see all files in their tenant
      filter.tenant = req.user.tenant?._id || null;
    } else {
      // Editor can only see their own files
      filter.user = req.user.id;
      filter.tenant = req.user.tenant?._id || null;
    }
    
    const files = await File.find(filter).populate('user', 'username email').sort({ createdAt: -1 });
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    
    const filesWithFullUrl = files.map(file => ({
      ...file.toObject(),
      fullUrl: `${baseUrl}${file.fileUrl}`
    }));
    
    res.json({ success: true, files: filesWithFullUrl, type });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getFiles = async (req, res) => {
  try {
    // Apply role-based filtering
    let filter = {};
    if (req.user.role.name === 'superadmin') {
      // Superadmin can see all files
    } else if (req.user.role.name === 'admin') {
      // Admin can see all files in their tenant
      filter.tenant = req.user.tenant?._id || null;
    } else {
      // Editor can only see their own files
      filter.user = req.user.id;
      filter.tenant = req.user.tenant?._id || null;
    }
    
    const isRaw = req.query.raw === 'true';
    const query = isRaw ? File.find(filter).lean().sort({ createdAt: -1 }) : File.find(filter).populate('user', 'username email').sort({ createdAt: -1 });
    const files = await query;
    
    if (isRaw) {
      return res.json(files);
    }
    
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const filesWithFullUrl = files.map(file => ({
      ...file.toObject(),
      fullUrl: `${baseUrl}${file.fileUrl}`
    }));
    
    res.json({ success: true, files: filesWithFullUrl });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getFileById = async (req, res) => {
  try {
    let filter = { _id: req.params.id };
    if (req.user.role.name !== 'superadmin') {
      filter.tenant = req.user.tenant?._id || null;
    }
    
    const file = await File.findOne(filter).populate('user', 'username email');
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }
    
    const isRaw = req.query.raw === 'true';
    if (isRaw) {
      return res.json(file.toObject());
    }
    
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const fileWithFullUrl = {
      ...file.toObject(),
      fullUrl: `${baseUrl}${file.fileUrl}`
    };
    
    res.json({ success: true, file: fileWithFullUrl });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }
    
    // Check tenant permissions
    if (req.user.role.name !== 'superadmin') {
      const userTenant = req.user.tenant?._id ? req.user.tenant._id.toString() : null;
      const fileTenant = file.tenant ? file.tenant.toString() : null;
      
      if (userTenant !== fileTenant) {
        return res.status(403).json({ success: false, message: 'Access denied. You can only delete files from your tenant.' });
      }
      
      if (req.user.role.name !== 'admin' && file.user.toString() !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Access denied. You can only delete your own files.' });
      }
    }

    // Delete physical file
    const safePath = sanitizePath(file.internalPath);
    if (fs.existsSync(safePath)) {
      fs.unlinkSync(safePath);
    }

    await File.findByIdAndDelete(req.params.id);
    
    res.json({ success: true, message: 'File deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const convertFileFormat = async (req, res) => {
  try {
    const { id } = req.params;
    const { format } = req.body;

    if (!format) {
      return res.status(400).json({ success: false, message: 'Target format is required' });
    }

    const file = await File.findById(id);
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    const convertedFile = await convertFile(file, format);
    
    // Delete old file
    if (fs.existsSync(file.internalPath)) {
      fs.unlinkSync(file.internalPath);
    }

    // Update file record
    file.internalPath = convertedFile.internalPath;
    file.fileUrl = convertedFile.fileUrl;
    file.format = convertedFile.format;
    await file.save();

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const fileWithFullUrl = {
      ...file.toObject(),
      fullUrl: `${baseUrl}${file.fileUrl}`
    };
    
    res.json({ 
      success: true, 
      message: `File converted to ${format}`, 
      file: fileWithFullUrl 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get raw file data
const getRawFiles = async (req, res) => {
  try {
    const files = await File.find({}).lean();
    res.json(files);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving raw files', error: error.message });
  }
};

// Get raw file by ID
const getRawFileById = async (req, res) => {
  try {
    const file = await File.findById(req.params.id).lean();
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }
    res.json(file);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving raw file', error: error.message });
  }
};

const updateFile = async (req, res) => {
  try {
    console.log('Update file request:', { id: req.params.id, hasFile: !!req.file, body: req.body });
    
    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }
    
    // Check permissions
    const userRole = req.user.role?.name || req.user.role;
    const isSuperAdmin = userRole === 'superadmin';
    const isAdmin = userRole === 'admin';
    const userTenant = req.user.tenant?._id ? req.user.tenant._id.toString() : null;
    const fileTenant = file.tenant ? file.tenant.toString() : null;
    const fileUserId = file.user?._id ? file.user._id.toString() : file.user.toString();
    const currentUserId = req.user.id.toString();
    const isOwner = fileUserId === currentUserId;
    
    console.log('Permission debug:', { userRole, isSuperAdmin, isAdmin, isOwner, fileUserId, currentUserId });
    
    if (!isSuperAdmin && !isAdmin && !isOwner) {
      return res.status(403).json({ success: false, message: 'Access denied. Admins and file owners can edit files.' });
    }

    // Handle file content update for JSON files
    if (req.file && file.format === 'json') {
      const safePath = sanitizePath(file.internalPath);
      
      // Write new content to existing file path instead of creating new file
      const fileBuffer = fs.readFileSync(req.file.path);
      fs.writeFileSync(safePath, fileBuffer);
      
      // Update file size
      file.fileSize = req.file.size;
      
      // Refresh JSON documents in database
      const JsonDocument = require('../models/jsonDocument');
      await JsonDocument.deleteMany({ sourceFile: file._id });
      await processJsonFile(file, req.user, file.tenant, file.collection);
      
      // Clean up temp file
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    }
    
    // Update metadata
    if (req.body.title) file.title = req.body.title;
    if (req.body.notes !== undefined) file.notes = req.body.notes;
    
    await file.save();
    
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const fileWithFullUrl = {
      ...file.toObject(),
      fullUrl: `${baseUrl}${file.fileUrl}`
    };
    
    res.json({ success: true, message: 'File updated successfully', file: fileWithFullUrl });
  } catch (error) {
    console.error('Update file error:', error);
    // Clean up temp file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { uploadFile, getFiles, getFileById, deleteFile, convertFileFormat, getFilesByType, getRawFiles, getRawFileById, updateFile };