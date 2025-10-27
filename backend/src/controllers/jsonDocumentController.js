const JsonDocument = require('../models/jsonDocument');
const File = require('../models/file');

const getJsonDocumentsByFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    
    // Check if file exists and user has access
    let filter = { _id: fileId };
    if (req.user.role.name !== 'superadmin') {
      filter.tenant = req.user.tenant?._id || null;
    }
    
    const file = await File.findOne(filter);
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }
    
    if (file.format !== 'json') {
      return res.status(400).json({ success: false, message: 'File is not a JSON file' });
    }
    
    const documents = await JsonDocument.find({ sourceFile: fileId }).sort({ index: 1 });
    
    res.json({
      success: true,
      data: documents.map(doc => doc.data),
      count: documents.length,
      file: {
        id: file._id,
        title: file.title,
        originalName: file.originalName
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllJsonDocuments = async (req, res) => {
  try {
    let filter = {};
    if (req.user.role.name !== 'superadmin') {
      filter.tenant = req.user.tenant?._id || null;
    }
    
    const documents = await JsonDocument.find(filter)
      .populate('sourceFile', 'title originalName fileUrl')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: documents,
      count: documents.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getJsonDocumentsByFile,
  getAllJsonDocuments
};