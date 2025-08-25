const createImage = require('./createImage');
const getImages = require('./getImages');
const getBulkImages = require('./getBulkImages');
const getImageById = require('./getImageById');
const updateImage = require('./updateImage');
const deleteImage = require('./deleteImage');
const genericPatch = require('./genericPatch'); 

module.exports = {
  createImage,
  getImages,
  getBulkImages,
  getImageById,
  updateImage,
  deleteImage,
  genericPatch
};
