const express = require('express');
const { getJsonDocumentsByFile, getAllJsonDocuments } = require('../controllers/jsonDocumentController');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();

router.get('/file/:fileId', authenticate, getJsonDocumentsByFile);
router.get('/', authenticate, getAllJsonDocuments);
router.post('/refresh/:fileId', authenticate, require('../controllers/jsonRefreshController').refreshJsonDocuments);

module.exports = router;