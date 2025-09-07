// controllers/fileController.js
const File = require('../models/file');
const { processFile } = require('../services/fileService');
const { convertFile } = require('../services/conversionService');
const fs = require('fs');

const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const { title, tenant = 'default', section = 'general' } = req.body;
    
    if (!title) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: 'Title is required' });
    }

    const processedFile = await processFile(req.file, tenant, section);
    
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    
    const newFile = new File({
      title,
      user: req.user.id,
      originalName: req.file.originalname,
      fileSize: req.file.size,
      ...processedFile,
      fullUrl: `${baseUrl}${processedFile.fileUrl}`
    });

    await newFile.save();
    
    // Clean up temp file
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      file: newFile
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

const getFiles = async (req, res) => {
  try {
    const files = await File.find().populate('user', 'username email').sort({ createdAt: -1 });
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
    const file = await File.findById(req.params.id).populate('user', 'username email');
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

module.exports = { uploadFile, getFiles, getFileById, deleteFile, convertFileFormat };