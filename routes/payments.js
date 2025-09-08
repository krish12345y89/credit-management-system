const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { generalLimiter } = require('../middleware/rateLimit');
const {
  createCheckoutSession,
  handleWebhook,
  getPaymentHistory
} = require('../controllers/paymentController');

// Apply rate limiting to all routes
router.use(generalLimiter);

// Webhook route needs raw body for Stripe verification
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// Apply authentication to other routes
router.use(authMiddleware);

// Protected payment routes
router.post('/create-checkout-session', createCheckoutSession);
router.get('/history', getPaymentHistory);

module.exports = router;
