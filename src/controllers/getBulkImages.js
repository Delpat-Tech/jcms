const Image = require('../models/image');

const getBulkImages = async (req, res) => {
  try {
    
    const { tenant, limit = 20, fields } = req.query;

    
    if (tenant) filter.tenant = tenant;

    // Projection (fields selection)
    let projection = null;
    if (fields) {
      projection = fields.split(',').join(' ');
    }

    const images = await Image.find(filter, projection).limit(Number(limit));

    // Build public URLs
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const data = images.map(img => {
      const result = img.toObject();
      if (result.convertedFiles) {
        result.convertedFiles = {
          webp: `${baseUrl}/${result.convertedFiles.webp}`,
          avif: `${baseUrl}/${result.convertedFiles.avif}`
        };
      }
      return result;
    });

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving bulk images', error: error.message });
  }
};
module.exports = getBulkImages;
