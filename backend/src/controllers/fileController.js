// controllers/fileController.js
const File = require('../models/file');
const { processFile } = require('../services/fileService');
const { convertFile } = require('../services/conversionService');
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

    const uploadedFiles = [];
    
    for (const file of files) {
      if (!file) continue;

      const { title, notes, section = 'general' } = req.body;
      const fileTitle = title || file.originalname;
      const tenantPath = req.user.tenant ? req.user.tenant._id.toString() : 'system';
      
      console.log('File upload data:', { title, notes, tenantPath, section });
      console.log('Creating file with notes:', notes);

      const processedFile = await processFile(file, tenantPath, section);
    
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const fullFileUrl = `${baseUrl}${processedFile.fileUrl}`;
    
      const newFile = new File({
        title: fileTitle,
        user: req.user.id,
        tenant: req.user.tenant?._id || null,
        tenantName: req.user.tenant ? req.user.tenant.name : 'System',
        originalName: file.originalname,
        fileSize: file.size,
        notes: notes || '',
        fileUrl: fullFileUrl,
        publicUrl: fullFileUrl,
        internalPath: processedFile.internalPath,
        fileType: processedFile.fileType,
        format: processedFile.format
      });

      await newFile.save();
      
      // Clean up temp file
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }

      uploadedFiles.push({
        ...newFile.toObject(),
        fullUrl: `${baseUrl}${processedFile.fileUrl}`
      });
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
    if (req.user.role.name !== 'superadmin') {
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
    // Apply tenant filtering
    let filter = {};
    if (req.user.role.name === 'superadmin') {
      // Superadmin can see all files
    } else {
      // Tenant users can only see their tenant's files
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

module.exports = { uploadFile, getFiles, getFileById, deleteFile, convertFileFormat, getFilesByType, getRawFiles, getRawFileById };