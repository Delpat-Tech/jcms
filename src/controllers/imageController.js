// controllers/imageController.js - All image operations
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const Image = require('../models/image');
const { safeDeleteFile } = require('../utils/safeDeleteFile');
const { isSystemAdmin } = require('../utils/systemAdmin');

sharp.cache(false);

// Create image
const createImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const { title, notes } = req.body;
    const tenantId = req.user.tenant;
    const uploadDir = `uploads/${tenantId}`;
    fs.mkdirSync(uploadDir, { recursive: true });

    const baseName = path.parse(req.file.originalname).name + '-' + Date.now();
    const imageBuffer = fs.readFileSync(req.file.path);
    const outputPath = path.join(uploadDir, `${baseName}.avif`);
    
    const metadata = await sharp(imageBuffer).metadata();
    await sharp(imageBuffer).avif({ quality: 80 }).toFile(outputPath);
    await safeDeleteFile(req.file.path);

    const newImage = await Image.create({
      title: title || 'Untitled',
      notes: notes ? JSON.parse(notes) : {},
      internalPath: outputPath.replace(/\\/g, '/'),
      fileUrl: `${req.protocol}://${req.get('host')}/${outputPath.replace(/\\/g, '/')}`,
      format: 'avif',
      width: metadata.width,
      height: metadata.height,
      user: req.user.id,
      tenant: tenantId
    });

    const realtime = req.app.get('realtime');
    if (realtime) {
      realtime.imageUploaded(tenantId, {
        id: newImage._id,
        title: newImage.title,
        fileUrl: newImage.fileUrl
      }, {
        id: req.user.id,
        username: req.user.username
      });
    }

    res.status(201).json({ success: true, message: 'Image uploaded successfully', data: newImage });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error uploading image', error: error.message });
  }
};

// Get all images
const getImages = async (req, res) => {
  try {
    if (!req.user || !req.user.id || !req.user.tenant || !req.user.role) {
      return res.status(401).json({ success: false, message: 'Invalid authentication data' });
    }
    
    const userId = req.user.id;
    const userRole = req.user.role;
    const tenantId = req.user.tenant;
    const { limit = 20, fields } = req.query;

    let filter = {};
    
    const systemAdmin = await isSystemAdmin(req.user);
    
    if (!systemAdmin) {
      filter.tenant = tenantId;
    }

    if (userRole !== 'admin') {
      filter.user = userId;
    }

    let projection = null;
    if (fields) {
      projection = fields.split(',').join(' ');
    }

    const images = await Image.find(filter, projection).limit(Number(limit));

    res.status(200).json({
      success: true,
      count: images.length,
      data: images,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving images",
      error: error.message,
    });
  }
};

// Get image by ID
const getImageById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!req.user || !req.user.tenant) {
      return res.status(401).json({ success: false, message: 'Invalid authentication' });
    }
    
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ success: false, message: 'Invalid image ID format' });
    }
    
    const systemAdmin = await isSystemAdmin(req.user);
    
    let filter = { _id: id };
    if (!systemAdmin) {
      filter.tenant = req.user.tenant;
    }
    
    const image = await Image.findOne(filter);

    if (!image) {
      return res.status(404).json({ success: false, message: 'Image not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Image retrieved successfully',
      data: image
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving image', error: error.message });
  }
};

// Update image
const updateImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, notes } = req.body;
    
    const systemAdmin = await isSystemAdmin(req.user);
    
    let filter = { _id: id };
    if (!systemAdmin) {
      filter.tenant = req.user.tenant;
    }
    
    const existingImage = await Image.findOne(filter);
    if (!existingImage) {
      return res.status(404).json({ success: false, message: 'Image not found' });
    }

    if (req.user.role !== 'admin' && existingImage.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this image' });
    }

    const updatedData = { title };

    if (notes) {
      try {
        updatedData.notes = typeof notes === 'string' ? JSON.parse(notes) : notes;
      } catch {
        return res.status(400).json({ success: false, message: 'Invalid JSON format for notes' });
      }
    }

    let chosenFormat = (req.body.format || existingImage.format).toLowerCase();
    
    const processImage = async (buffer, uploadDir, baseName) => {
      const outputPath = path.join(uploadDir, `${baseName}.${chosenFormat}`);
      await sharp(buffer).toFormat(chosenFormat, { quality: 80 }).toFile(outputPath);
      return outputPath.replace(/\\/g, '/');
    };

    if (req.file) {
      const tenantId = req.user.tenant;
      const uploadDir = `uploads/${tenantId}`;
      fs.mkdirSync(uploadDir, { recursive: true });
      
      const baseName = path.parse(req.file.originalname).name + '-' + Date.now();
      const imageBuffer = fs.readFileSync(req.file.path);
      
      await safeDeleteFile(req.file.path);
      
      if (existingImage.internalPath) await safeDeleteFile(existingImage.internalPath);

      const internalPath = await processImage(imageBuffer, uploadDir, baseName);
      updatedData.internalPath = internalPath;
      updatedData.fileUrl = `${req.protocol}://${req.get('host')}/${internalPath}`;
      updatedData.format = chosenFormat;

    } else if (chosenFormat !== existingImage.format) {
      const oldPath = existingImage.internalPath;
      const uploadDir = path.dirname(oldPath);
      const baseName = path.parse(oldPath).name;
      const imageBuffer = fs.readFileSync(oldPath);

      const internalPath = await processImage(imageBuffer, uploadDir, baseName);
      await safeDeleteFile(oldPath);

      updatedData.internalPath = internalPath;
      updatedData.fileUrl = `${req.protocol}://${req.get('host')}/${internalPath}`;
      updatedData.format = chosenFormat;
    }

    const updatedImage = await Image.findByIdAndUpdate(id, updatedData, { new: true });

    const realtime = req.app.get('realtime');
    if (realtime) {
      realtime.imageUpdated(req.user.tenant, {
        id: updatedImage._id,
        title: updatedImage.title,
        fileUrl: updatedImage.fileUrl
      }, {
        id: req.user.id,
        username: req.user.username
      });
    }

    res.status(200).json({ success: true, message: 'Image updated successfully', data: updatedImage });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating image', error: error.message });
  }
};

// Patch image
const patchImage = async (req, res) => {
  try {
    const { id } = req.params;
    const updateFields = req.body;

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ success: false, message: 'Request body is missing or empty' });
    }

    const systemAdmin = await isSystemAdmin(req.user);
    
    let filter = { _id: id };
    if (!systemAdmin) {
      filter.tenant = req.user.tenant;
    }
    
    const existingImage = await Image.findOne(filter);
    if (!existingImage) {
      return res.status(404).json({ success: false, message: 'Image not found' });
    }

    if (req.user.role !== 'admin' && existingImage.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this image' });
    }
    
    const dataToUpdate = {};
    if (updateFields.title) dataToUpdate.title = updateFields.title;
    if (updateFields.notes) dataToUpdate.notes = updateFields.notes;

    if (updateFields.format && updateFields.format.toLowerCase() !== existingImage.format) {
      const newFormat = updateFields.format.toLowerCase();
      const oldPath = existingImage.internalPath;
      const uploadDir = path.dirname(oldPath);
      const baseName = path.parse(oldPath).name;
      const imageBuffer = fs.readFileSync(oldPath);

      const newPath = path.join(uploadDir, `${baseName}.${newFormat}`);
      await sharp(imageBuffer).toFormat(newFormat, { quality: 80 }).toFile(newPath);
      await safeDeleteFile(oldPath);
      
      dataToUpdate.format = newFormat;
      dataToUpdate.internalPath = newPath.replace(/\\/g, '/');
      dataToUpdate.fileUrl = `${req.protocol}://${req.get('host')}/${dataToUpdate.internalPath}`;
    }

    if (Object.keys(dataToUpdate).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields provided to update' });
    }

    const updatedImage = await Image.findByIdAndUpdate(id, dataToUpdate, { new: true });

    res.status(200).json({
      success: true,
      message: 'Image updated successfully',
      data: updatedImage,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating image',
      error: error.message,
    });
  }
};

// Delete image
const deleteImage = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const tenantId = req.user.tenant;
    const role = req.user.role;

    const systemAdmin = await isSystemAdmin(req.user);
    
    let filter = { _id: id };
    if (!systemAdmin) {
      filter.tenant = tenantId;
    }
    
    const image = await Image.findOne(filter);
    if (!image) {
      return res.status(404).json({ success: false, message: 'Image not found' });
    }

    if (role !== 'admin' && image.user.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this image' });
    }

    await image.deleteOne();

    if (image.internalPath) {
      await safeDeleteFile(image.internalPath);
    }

    const realtime = req.app.get('realtime');
    if (realtime) {
      realtime.imageDeleted(req.user.tenant, {
        id: image._id,
        title: image.title
      }, {
        id: req.user.id,
        username: req.user.username
      });
    }

    res.status(200).json({ success: true, message: 'Image and file deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting image', error: error.message });
  }
};

module.exports = {
  createImage,
  getImages,
  getImageById,
  updateImage,
  patchImage,
  deleteImage
};