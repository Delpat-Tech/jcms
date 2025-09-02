// routes/imageRoutes.js
const express = require('express');
const upload = require('../middlewares/upload');
const auth = require('../middlewares/auth');

const {
  createImage,
  getImages,
  getImageById,
  updateImage,
  deleteImage,
  patchImage,
  getBulkImages
} = require('../controllers/imageController');

const router = express.Router();

router.post('/', auth, upload.single('image'), createImage);
router.get('/', auth, getImages);
router.get('/bulk', auth, getBulkImages);
router.get('/:id', auth, getImageById);
router.put('/:id', auth, upload.single('image'), updateImage);
router.patch('/:id', auth, patchImage);
router.delete('/:id', auth, deleteImage);

module.exports = router;