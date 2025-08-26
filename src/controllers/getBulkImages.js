const Image = require('../models/image');

const getBulkImages = async (req, res) => {
  try {
    const { tenant, limit = 20, fields } = req.query;
    const filter = {};
    if (tenant) filter.tenant = tenant;

    let projection = null;
    if (fields) {
      projection = fields.split(',').join(' ');
    }

    const images = await Image.find(filter, projection).limit(Number(limit));

    res.json({ success: true, data: images });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving bulk images', error: error.message });
  }
};
module.exports = getBulkImages;