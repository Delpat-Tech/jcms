const fs = require('fs');
const JsonDocument = require('../models/jsonDocument');

const processJsonFile = async (file, user, tenant, collection = null) => {
  try {
    const fileContent = fs.readFileSync(file.internalPath, 'utf8');
    const jsonData = JSON.parse(fileContent);
    
    // Handle both array and single object
    const dataArray = Array.isArray(jsonData) ? jsonData : [jsonData];
    
    const documents = [];
    
    for (let i = 0; i < dataArray.length; i++) {
      const document = new JsonDocument({
        sourceFile: file._id,
        user: user.id,
        tenant: tenant,
        collection: collection,
        data: dataArray[i],
        index: i
      });
      
      await document.save();
      documents.push(document);
    }
    
    return {
      success: true,
      documentsCreated: documents.length,
      documents
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

const getJsonDocuments = async (fileId) => {
  try {
    const documents = await JsonDocument.find({ sourceFile: fileId }).sort({ index: 1 });
    return documents.map(doc => doc.data);
  } catch (error) {
    throw new Error(`Failed to retrieve JSON documents: ${error.message}`);
  }
};

module.exports = {
  processJsonFile,
  getJsonDocuments
};