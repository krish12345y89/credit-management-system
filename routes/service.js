const express = require('express');
const router = express.Router();
const { apiKeyLimiter } = require('../middleware/rateLimit');
const apiKeyAuth = require('../middleware/apiKeyAuth');
const {
  getUserMetadata,
  getUserReports
} = require('../controllers/serviceController');

router.use(apiKeyLimiter);
router.use(apiKeyAuth);

router.get('/users/:userId/metadata', getUserMetadata);
router.get('/users/:userId/reports', getUserReports);

module.exports = router;
