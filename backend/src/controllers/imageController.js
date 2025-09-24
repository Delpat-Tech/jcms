// controllers/imageController.js
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const Image = require('../models/image');
const { safeDeleteFile } = require('../utils/safeDeleteFile');
const { sanitizePath, sanitizeFilename } = require('../utils/pathSanitizer');
const { sanitizeForLog } = require('../utils/inputSanitizer');
const logger = require('../config/logger');

sharp.cache(false);

const createImage = async (req, res) => {
  try {
    console.log('=== IMAGE UPLOAD START ===');
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an image.' });
    }

    const { title } = req.body;
    const userId = req.user.id;
    
    console.log('Image upload req.body:', req.body);
    console.log('File info:', req.file);

    if (req.body.notes) {
      try {
        req.body.notes = JSON.parse(req.body.notes);
      } catch (error) {
        await safeDeleteFile(req.file.path);
        return res.status(400).json({ success: false, error: "Invalid JSON format for notes" });
      }
    }

    const allowedFormats = ['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif', 'tiff', 'bmp'];
    let chosenFormat = (req.body.format || 'webp').toLowerCase();
    if (!allowedFormats.includes(chosenFormat)) chosenFormat = 'webp';
    if (chosenFormat === 'jpg') chosenFormat = 'jpeg';

    // Tenant-based file organization
    const tenantPath = req.user.tenant ? req.user.tenant._id.toString() : 'system';
    const tenantName = req.user.tenant ? req.user.tenant.name : 'System';
    const uploadDir = path.join(__dirname, '..', '..', 'uploads', tenantPath, userId.toString());
    console.log('Creating upload directory:', uploadDir);
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('Directory created successfully');

    const sanitizedFilename = sanitizeFilename(req.file.originalname);
    const baseName = path.parse(sanitizedFilename).name + '-' + Date.now();
    const imageBuffer = fs.readFileSync(req.file.path);
    await safeDeleteFile(req.file.path);

    const outputPath = path.join(uploadDir, `${baseName}.${chosenFormat}`);
    console.log('Output path:', outputPath);
    
    console.log('Processing image with Sharp...');
    const sharpInstance = sharp(imageBuffer);
    if (chosenFormat === 'webp') await sharpInstance.webp({ quality: 80 }).toFile(outputPath);
    else if (chosenFormat === 'avif') await sharpInstance.avif({ quality: 50 }).toFile(outputPath);
    else if (chosenFormat === 'jpeg') await sharpInstance.jpeg({ quality: 80 }).toFile(outputPath);
    else if (chosenFormat === 'png') await sharpInstance.png({ compressionLevel: 8 }).toFile(outputPath);
    else if (chosenFormat === 'gif') await sharpInstance.gif().toFile(outputPath);
    else if (chosenFormat === 'tiff') await sharpInstance.tiff({ quality: 80 }).toFile(outputPath);
    else if (chosenFormat === 'bmp') await sharpInstance.toFormat('bmp').toFile(outputPath);
    
    // Get file size
    const fileStats = fs.statSync(outputPath);
    const fileSize = fileStats.size;

    const internalPath = outputPath.replace(/\\/g, '/');
    const relativePath = path.relative(path.join(__dirname, '..', '..'), outputPath).replace(/\\/g, '/');
    const fileUrl = `${req.protocol}://${req.get('host')}/${relativePath}`;

    console.log('Creating database record...');
    const imageData = {
      title,
      user: userId,
      tenant: req.user.tenant ? req.user.tenant._id : null,
      tenantName,
      internalPath,
      fileUrl,
      publicUrl: fileUrl,
      format: chosenFormat,
      fileSize,
      notes: req.body.notes || {},
    };
    console.log('Image data to save:', imageData);
    const newImage = await Image.create(imageData);
    console.log('Database record created successfully');

    console.log('=== IMAGE UPLOAD SUCCESS ===');
    console.log('Sending response:', { success: true, data: newImage });
    return res.status(201).json({ success: true, data: newImage });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ success: false, message: 'Error creating image', error: error.message });
  }
};

const getImages = async (req, res) => {
  try {
    // Check user role
    const User = require('../models/user');
    const currentUser = await User.findById(req.user.id).populate('role');
    const userRole = currentUser.role.name;
    
    // Check if user wants only their own images
    const ownOnly = req.query.own === 'true';
    
    let filter = {};
    
    if (ownOnly) {
      // Return only current user's images regardless of role
      filter.user = req.user.id;
    } else {
      // Apply tenant + role-based filtering
      if (userRole === 'superadmin') {
        // Superadmin can see all images from all tenants
      } else {
        // All other roles can only see images from their tenant
        filter.tenant = req.user.tenant ? req.user.tenant._id : null;
        
        if (userRole === 'admin') {
          // Admin can see all images within their tenant
        } else {
          // Editor/viewer can ONLY see their own images within their tenant
          filter.user = req.user.id;
        }
      }
    }
    
    const isRaw = req.query.raw === 'true';
    const query = isRaw ? Image.find(filter).lean() : Image.find(filter).populate('user', 'username email');
    const images = await query;
    
    if (isRaw) {
      return res.json(images);
    }
    
    res.status(200).json({ 
      success: true, 
      data: images,
      filter: ownOnly ? 'own' : 'all_allowed'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving images', error: error.message });
  }
};

const getImageById = async (req, res) => {
  try {
    const { id } = req.params;
    const image = await Image.findById(id);
    if (!image) {
      return res.status(404).json({ success: false, message: 'Image not found' });
    }
    
    // Check tenant + access permissions
    const User = require('../models/user');
    const currentUser = await User.findById(req.user.id).populate('role');
    const userRole = currentUser.role.name;
    
    if (userRole === 'superadmin') {
      // Superadmin can access all images from all tenants
    } else {
      // Check tenant access first
      const userTenant = req.user.tenant ? req.user.tenant._id.toString() : null;
      const imageTenant = image.tenant ? image.tenant.toString() : null;
      
      if (userTenant !== imageTenant) {
        return res.status(403).json({ success: false, message: 'Access denied. You can only access images from your tenant.' });
      }
      
      if (userRole === 'admin') {
        // Admin can view all images within their tenant
      } else {
        // Editor/viewer can ONLY access their own images within their tenant
        if (image.user.toString() !== req.user.id) {
          return res.status(403).json({ success: false, message: 'Access denied. You can only access your own images.' });
        }
      }
    }
    
    const isRaw = req.query.raw === 'true';
    if (isRaw) {
      return res.json(image.toObject());
    }
    
    res.status(200).json({ success: true, data: image });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving image', error: error.message });
  }
};

const updateImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;
    
    const image = await Image.findById(id);
    if (!image) {
      return res.status(404).json({ success: false, message: 'Image not found' });
    }
    
    // Check tenant + modification permissions
    const User = require('../models/user');
    const currentUser = await User.findById(req.user.id).populate('role');
    const userRole = currentUser.role.name;
    
    if (userRole === 'superadmin') {
      // Superadmin can modify all images from all tenants
    } else {
      // Check tenant access first
      const userTenant = req.user.tenant ? req.user.tenant._id.toString() : null;
      const imageTenant = image.tenant ? image.tenant.toString() : null;
      
      if (userTenant !== imageTenant) {
        return res.status(403).json({ success: false, message: 'Access denied. You can only modify images from your tenant.' });
      }
      
      if (userRole === 'admin') {
        // Admin can modify all images within their tenant
      } else {
        // Editor/viewer can only modify their own images within their tenant
        if (image.user.toString() !== req.user.id) {
          return res.status(403).json({ success: false, message: 'Access denied. You can only modify your own images.' });
        }
      }
    }
    
    const updatedImage = await Image.findByIdAndUpdate(id, { title }, { new: true });
    
    res.status(200).json({ success: true, data: updatedImage });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating image', error: error.message });
  }
};

const patchImage = async (req, res) => {
  try {
    const { id } = req.params;
    const updateFields = req.body;
    
    const image = await Image.findById(id);
    if (!image) {
      return res.status(404).json({ success: false, message: 'Image not found' });
    }
    
    // Check tenant + modification permissions
    const User = require('../models/user');
    const currentUser = await User.findById(req.user.id).populate('role');
    const userRole = currentUser.role.name;
    
    if (userRole === 'superadmin') {
      // Superadmin can modify all images from all tenants
    } else {
      // Check tenant access first
      const userTenant = req.user.tenant ? req.user.tenant._id.toString() : null;
      const imageTenant = image.tenant ? image.tenant.toString() : null;
      
      if (userTenant !== imageTenant) {
        return res.status(403).json({ success: false, message: 'Access denied. You can only modify images from your tenant.' });
      }
      
      if (userRole === 'admin') {
        // Admin can modify all images within their tenant
      } else {
        // Editor/viewer can only modify their own images within their tenant
        if (image.user.toString() !== req.user.id) {
          return res.status(403).json({ success: false, message: 'Access denied. You can only modify your own images.' });
        }
      }
    }
    
    const dataToUpdate = {};
    if (updateFields.title) dataToUpdate.title = updateFields.title;
    if (updateFields.notes) dataToUpdate.notes = updateFields.notes;

    // Handle format conversion
    if (updateFields.format && updateFields.format.toLowerCase() !== image.format) {
      const newFormat = updateFields.format.toLowerCase();
      const allowedFormats = ['webp', 'avif', 'jpg', 'jpeg', 'png', 'gif', 'tiff', 'bmp'];
      
      if (!allowedFormats.includes(newFormat)) {
        return res.status(400).json({ success: false, message: 'Invalid format. Allowed: webp, avif, jpg, jpeg, png, gif, tiff, bmp' });
      }
      
      const oldPath = sanitizePath(image.internalPath);
      const uploadDir = path.dirname(oldPath);
      const baseName = path.parse(oldPath).name;
      
      // Read existing image
      const imageBuffer = fs.readFileSync(oldPath);
      
      // Create new path with new format
      const newPath = sanitizePath(path.join(uploadDir, `${baseName}.${newFormat}`));
      
      // Convert image to new format
      const sharpInstance = sharp(imageBuffer);
      if (newFormat === 'webp') await sharpInstance.webp({ quality: 80 }).toFile(newPath);
      else if (newFormat === 'avif') await sharpInstance.avif({ quality: 50 }).toFile(newPath);
      else if (newFormat === 'jpeg' || newFormat === 'jpg') await sharpInstance.jpeg({ quality: 80 }).toFile(newPath);
      else if (newFormat === 'png') await sharpInstance.png({ compressionLevel: 8 }).toFile(newPath);
      else if (newFormat === 'gif') await sharpInstance.gif().toFile(newPath);
      else if (newFormat === 'tiff') await sharpInstance.tiff({ quality: 80 }).toFile(newPath);
      else if (newFormat === 'bmp') await sharpInstance.toFormat('bmp').toFile(newPath);
      
      // Delete old file
      await safeDeleteFile(oldPath);
      
      // Update paths and format
      dataToUpdate.format = newFormat;
      dataToUpdate.internalPath = newPath.replace(/\\/g, '/');
      dataToUpdate.fileUrl = `${req.protocol}://${req.get('host')}/${dataToUpdate.internalPath}`;
    }
    
    const updatedImage = await Image.findByIdAndUpdate(id, dataToUpdate, { new: true });
    
    res.status(200).json({ success: true, data: updatedImage });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating image', error: error.message });
  }
};

const deleteImage = async (req, res) => {
  try {
    const { id } = req.params;
    
    const image = await Image.findById(id);
    if (!image) {
      return res.status(404).json({ success: false, message: 'Image not found' });
    }
    
    // Check tenant + deletion permissions
    const User = require('../models/user');
    const currentUser = await User.findById(req.user.id).populate('role');
    const userRole = currentUser.role.name;
    
    if (userRole === 'superadmin') {
      // Superadmin can delete all images from all tenants
    } else {
      // Check tenant access first
      const userTenant = req.user.tenant ? req.user.tenant._id.toString() : null;
      const imageTenant = image.tenant ? image.tenant.toString() : null;
      
      if (userTenant !== imageTenant) {
        return res.status(403).json({ success: false, message: 'Access denied. You can only delete images from your tenant.' });
      }
      
      if (userRole === 'admin') {
        // Admin can delete all images within their tenant
      } else {
        // Editor/viewer can only delete their own images within their tenant
        if (image.user.toString() !== req.user.id) {
          return res.status(403).json({ success: false, message: 'Access denied. You can only delete your own images.' });
        }
      }
    }
    
    await Image.findByIdAndDelete(id);
    
    if (image.internalPath) {
      await safeDeleteFile(image.internalPath);
    }
    
    res.status(200).json({ success: true, message: 'Image deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting image', error: error.message });
  }
};

const getBulkImages = async (req, res) => {
  try {
    const { limit = 20, fields, userId } = req.query;
    let filter = {};
    
    // Apply tenant filtering for non-superadmin users
    const User = require('../models/user');
    const currentUser = await User.findById(req.user.id).populate('role');
    const userRole = currentUser.role.name;
    
    if (userRole !== 'superadmin') {
      filter.tenant = req.user.tenant ? req.user.tenant._id : null;
    }
    
    if (userId) {
      filter.user = userId;
    } else {
      filter.user = req.user.id;
    }

    let projection = null;
    if (fields) {
      projection = fields.split(',').join(' ');
    }

    const images = await Image.find(filter, projection || null).limit(Number(limit));

    res.json({ success: true, data: images });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving bulk images', error: error.message });
  }
};

// Get raw image data
const getRawImages = async (req, res) => {
  try {
    const images = await Image.find({}).lean();
    res.json(images);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving raw images', error: error.message });
  }
};

// Get raw image by ID
const getRawImageById = async (req, res) => {
  try {
    const image = await Image.findById(req.params.id).lean();
    if (!image) {
      return res.status(404).json({ success: false, message: 'Image not found' });
    }
    res.json(image);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving raw image', error: error.message });
  }
};

module.exports = {
  createImage,
  getImages,
  getImageById,
  updateImage,
  patchImage,
  deleteImage,
  getBulkImages,
  getRawImages,
  getRawImageById
};