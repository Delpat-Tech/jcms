// routes/contentRoutes.js
const express = require('express');
const { authenticate, requireEditorOrAbove } = require('../middlewares/auth');
const { checkSubscription } = require('../middlewares/subscription');

const { logActivity } = require('../middlewares/activityLogger');
const {
  createContent,
  getContent,
  getContentById,
  updateContent,
  deleteContent,
  publishContent,
  scheduleContent,
  getContentByStatus
} = require('../controllers/contentController');

const router = express.Router();

// All routes require authentication and editor role or above
router.use(authenticate, requireEditorOrAbove);

// Content CRUD
router.post('/', logActivity('CREATE', 'content'), createContent);
router.get('/', checkSubscription('standard'), getContent);
router.get('/status/:status', checkSubscription('standard'), getContentByStatus);
router.get('/:id', checkSubscription('standard'), getContentById);
router.put('/:id', logActivity('UPDATE', 'content'), updateContent);
router.delete('/:id', logActivity('DELETE', 'content'), deleteContent);

// Publishing actions
router.post('/:id/publish', logActivity('PUBLISH', 'content'), publishContent);
router.post('/:id/schedule', logActivity('SCHEDULE', 'content'), scheduleContent);

module.exports = router;