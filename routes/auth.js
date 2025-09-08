const express = require('express');
const router = express.Router();
const { authLimiter } = require('../middleware/rateLimit');
const { validateSignup, validateLogin } = require('../middleware/validation');
const {
  signup,
  login,
  refreshToken,
  logout
} = require('../controllers/authController');

router.use(authLimiter);

// Public routes
router.post('/signup', validateSignup, signup);
router.post('/login', validateLogin, login);
router.post('/refresh', refreshToken);
router.post('/logout', logout);

module.exports = router;