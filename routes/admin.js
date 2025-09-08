const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/auth');
const { generalLimiter } = require('../middleware/rateLimit');
const {
  validateAddCredits,
  validateCreateApiKey
} = require('../middleware/validation');
const {
  addCredits,
  createApiKey,
  revokeApiKey,
  getAuditLogs,
  getUsers
} = require('../controllers/adminController');

// Apply rate limiting and authentication
router.use(generalLimiter);
router.use(authMiddleware);
router.use(requireRole('admin'));

// Protected admin routes
router.post('/credits', validateAddCredits, addCredits);
router.post('/api-keys', validateCreateApiKey, createApiKey);
router.post('/api-keys/revoke', revokeApiKey);
router.get('/audit-logs', getAuditLogs);
router.get('/users', getUsers);

module.exports = router;
