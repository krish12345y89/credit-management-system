const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { generalLimiter } = require('../middleware/rateLimit');
const {
  getProfile,
  getCredits,
  uploadFile,
  generateReport,
  getCreditTransactions,
  uploadMiddleware
} = require('../controllers/userController');
const multer = require('multer');

router.use(generalLimiter);
router.use(authMiddleware);

// Protected user routes
router.get('/profile', getProfile);
router.get('/credits', getCredits);
router.post('/upload',uploadMiddleware, uploadFile);
router.post('/report', generateReport);
router.get('/transactions', getCreditTransactions);

module.exports = router;