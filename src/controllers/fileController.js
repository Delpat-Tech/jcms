// controllers/fileController.js
const File = require('../models/file');
const { processFile } = require('../services/fileService');
const { convertFile } = require('../services/conversionService');
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

      const { title, tenant = 'default', section = 'general' } = req.body;
      const fileTitle = title || file.originalname;

      const processedFile = await processFile(file, tenant, section);
    
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    
      const newFile = new File({
        title: fileTitle,
        user: req.user.id,
        tenant: req.user.tenant?._id || null,
        originalName: file.originalname,
        fileSize: file.size,
        ...processedFile
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

      // Send notification
      const notification = {
        action: 'file_upload',
        timestamp: new Date(),
        data: {
          username: req.user.username || 'Unknown',
          resource: 'File',
          resourceId: newFile._id,
          userRole: req.user.role?.name || 'user',
          details: { ip: req.ip, fileName: file.originalname, fileType: processedFile.fileType }
        }
      };
      global.io.emit('admin_notification', notification);
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
      fileSize: formatFileSize(file.fileSize),
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
    
    const files = await File.find(filter).populate('user', 'username email').sort({ createdAt: -1 });
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

    // Delete physical file
    if (fs.existsSync(file.internalPath)) {
      fs.unlinkSync(file.internalPath);
    }

    await File.findByIdAndDelete(req.params.id);
    
    // Send notification
    const notification = {
      action: 'file_delete',
      timestamp: new Date(),
      data: {
        username: req.user.username || 'Unknown',
        resource: 'File',
        resourceId: req.params.id,
        userRole: req.user.role?.name || 'user',
        details: { ip: req.ip, fileName: file.originalName }
      }
    };
    global.io.emit('admin_notification', notification);
    
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

    // Send notification
    const notification = {
      action: 'file_convert',
      timestamp: new Date(),
      data: {
        username: req.user.username || 'Unknown',
        resource: 'File',
        resourceId: req.params.id,
        userRole: req.user.role?.name || 'user',
        details: { ip: req.ip, fromFormat: file.format, toFormat: format }
      }
    };
    global.io.emit('admin_notification', notification);
    
    res.json({ 
      success: true, 
      message: `File converted to ${format}`, 
      file: fileWithFullUrl 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { uploadFile, getFiles, getFileById, deleteFile, convertFileFormat, getFilesByType };