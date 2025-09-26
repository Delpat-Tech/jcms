// routes/authRoutes.js
const express = require('express');
const { registerUser, loginUser, getCurrentUser } = require('../controllers/authController');
const { authenticate } = require('../middlewares/auth');
const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', authenticate, getCurrentUser);

module.exports = router;