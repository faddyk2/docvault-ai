const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  login,
  logout,
  getCurrentUser,
  register
} = require('../controllers/authController');

router.post('/login', login);
router.post('/logout', logout);
router.get('/me', authenticate, getCurrentUser);
router.post('/register', register);

module.exports = router;
