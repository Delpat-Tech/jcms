// controllers/imageController.js
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const Image = require('../models/image');
const { safeDeleteFile } = require('../utils/safeDeleteFile');

sharp.cache(false);

const createImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an image.' });
    }

    const { title } = req.body;
    const userId = req.user.id;

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

    const uploadDir = `uploads/${userId}`;
    fs.mkdirSync(uploadDir, { recursive: true });

    const baseName = path.parse(req.file.originalname).name + '-' + Date.now();
    const imageBuffer = fs.readFileSync(req.file.path);
    await safeDeleteFile(req.file.path);

    const outputPath = path.join(uploadDir, `${baseName}.${chosenFormat}`);
    
    const sharpInstance = sharp(imageBuffer);
    if (chosenFormat === 'webp') await sharpInstance.webp({ quality: 80 }).toFile(outputPath);
    else if (chosenFormat === 'avif') await sharpInstance.avif({ quality: 50 }).toFile(outputPath);
    else if (chosenFormat === 'jpeg') await sharpInstance.jpeg({ quality: 80 }).toFile(outputPath);
    else if (chosenFormat === 'png') await sharpInstance.png({ compressionLevel: 8 }).toFile(outputPath);
    else if (chosenFormat === 'gif') await sharpInstance.gif().toFile(outputPath);
    else if (chosenFormat === 'tiff') await sharpInstance.tiff({ quality: 80 }).toFile(outputPath);
    else if (chosenFormat === 'bmp') await sharpInstance.toFormat('bmp').toFile(outputPath);

    const internalPath = outputPath.replace(/\\/g, '/');
    const fileUrl = `${req.protocol}://${req.get('host')}/${internalPath}`;

    const newImage = await Image.create({
      title,
      user: userId,
      internalPath,
      fileUrl,
      format: chosenFormat,
      notes: req.body.notes || {},
    });

    res.status(201).json({ success: true, data: newImage });
  } catch (error) {
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
      // Apply role-based filtering
      if (userRole === 'superadmin') {
        // Superadmin can see all images
      } else if (userRole === 'admin') {
        // Admin can see own images + editor/viewer images + other admin images (but NOT superadmin images)
        const Role = require('../models/role');
        const editorRole = await Role.findOne({ name: 'editor' });
        const viewerRole = await Role.findOne({ name: 'viewer' });
        const adminRole = await Role.findOne({ name: 'admin' });
        
        const allowedUsers = await User.find({
          $or: [
            { _id: req.user.id }, // Own images
            { role: { $in: [editorRole._id, viewerRole._id, adminRole._id] } } // Editor/viewer/admin images
          ]
        }).select('_id');
        
        filter.user = { $in: allowedUsers.map(u => u._id) };
      } else {
        // Editor/viewer can ONLY see their own images
        filter.user = req.user.id;
      }
    }
    
    const images = await Image.find(filter);
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
    
    // Check access permissions
    const User = require('../models/user');
    const currentUser = await User.findById(req.user.id).populate('role');
    const userRole = currentUser.role.name;
    
    if (userRole === 'superadmin') {
      // Superadmin can access all images
    } else if (userRole === 'admin') {
      // Admin can view own + editor/viewer + other admin images, but NOT superadmin images
      const imageOwner = await User.findById(image.user).populate('role');
      const ownerRole = imageOwner.role.name;
      
      if (ownerRole === 'superadmin') {
        return res.status(403).json({ success: false, message: 'Access denied. You cannot access superadmin images.' });
      }
    } else {
      // Editor/viewer can ONLY access their own images
      if (image.user.toString() !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Access denied. You can only access your own images.' });
      }
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
    
    // Check modification permissions
    const User = require('../models/user');
    const currentUser = await User.findById(req.user.id).populate('role');
    const userRole = currentUser.role.name;
    
    if (userRole === 'superadmin') {
      // Superadmin can modify all images
    } else if (userRole === 'admin') {
      // Admin can modify own + editor/viewer images, but NOT other admin or superadmin images
      const imageOwner = await User.findById(image.user).populate('role');
      const ownerRole = imageOwner.role.name;
      
      if (image.user.toString() !== req.user.id && (ownerRole === 'admin' || ownerRole === 'superadmin')) {
        return res.status(403).json({ success: false, message: 'Access denied. You cannot modify images uploaded by other admins or superadmin.' });
      }
    } else {
      // Editor/viewer can only modify their own
      if (image.user.toString() !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Access denied. You can only modify your own images.' });
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
    
    // Check modification permissions
    const User = require('../models/user');
    const currentUser = await User.findById(req.user.id).populate('role');
    const userRole = currentUser.role.name;
    
    if (userRole === 'superadmin') {
      // Superadmin can modify all images
    } else if (userRole === 'admin') {
      // Admin can modify own + editor/viewer images, but NOT other admin or superadmin images
      const imageOwner = await User.findById(image.user).populate('role');
      const ownerRole = imageOwner.role.name;
      
      if (image.user.toString() !== req.user.id && (ownerRole === 'admin' || ownerRole === 'superadmin')) {
        return res.status(403).json({ success: false, message: 'Access denied. You cannot modify images uploaded by other admins or superadmin.' });
      }
    } else {
      // Editor/viewer can only modify their own
      if (image.user.toString() !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Access denied. You can only modify your own images.' });
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
      
      const oldPath = image.internalPath;
      const uploadDir = path.dirname(oldPath);
      const baseName = path.parse(oldPath).name;
      
      // Read existing image
      const imageBuffer = fs.readFileSync(oldPath);
      
      // Create new path with new format
      const newPath = path.join(uploadDir, `${baseName}.${newFormat}`);
      
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
    
    // Check deletion permissions
    const User = require('../models/user');
    const currentUser = await User.findById(req.user.id).populate('role');
    const userRole = currentUser.role.name;
    
    if (userRole === 'superadmin') {
      // Superadmin can delete all images
    } else if (userRole === 'admin') {
      // Admin can delete own + editor/viewer images, but NOT other admin or superadmin images
      const imageOwner = await User.findById(image.user).populate('role');
      const ownerRole = imageOwner.role.name;
      
      if (image.user.toString() !== req.user.id && (ownerRole === 'admin' || ownerRole === 'superadmin')) {
        return res.status(403).json({ success: false, message: 'Access denied. You cannot delete images uploaded by other admins or superadmin.' });
      }
    } else {
      // Editor/viewer can only delete their own
      if (image.user.toString() !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Access denied. You can only delete your own images.' });
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

module.exports = {
  createImage,
  getImages,
  getImageById,
  updateImage,
  patchImage,
  deleteImage,
  getBulkImages
};