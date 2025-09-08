const express = require('express');
const router = express.Router();
const { apiKeyLimiter } = require('../middleware/rateLimit');
const apiKeyAuth = require('../middleware/apiKeyAuth');
const {
  getUserMetadata,
  getUserReports
} = require('../controllers/serviceController');

// Apply API key authentication and rate limiting
router.use(apiKeyLimiter);
router.use(apiKeyAuth);

// Service routes (accessed via API keys)
router.get('/users/:userId/metadata', getUserMetadata);
router.get('/users/:userId/reports', getUserReports);

module.exports = router;
