// routes/publicContentRoutes.js
const express = require('express');
const { getPublicContentBySlugOrId } = require('../controllers/contentController');

const router = express.Router();

// Public, no auth
router.get('/content/:idOrSlug', getPublicContentBySlugOrId);

module.exports = router;
