const File = require('../models/file');
const JsonDocument = require('../models/jsonDocument');
const { processJsonFile } = require('../services/jsonProcessingService');

const refreshJsonDocuments = async (req, res) => {
  try {
    const { fileId } = req.params;
    
    const file = await File.findById(fileId);
    if (!file || file.format !== 'json') {
      return res.status(404).json({ success: false, message: 'JSON file not found' });
    }
    
    // Delete existing documents
    await JsonDocument.deleteMany({ sourceFile: fileId });
    
    // Reprocess the file
    const result = await processJsonFile(file, { id: file.user }, file.tenant, file.collection);
    
    res.json({
      success: true,
      message: 'JSON documents refreshed',
      documentsCreated: result.documentsCreated
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { refreshJsonDocuments };