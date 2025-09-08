const rateLimit = require('express-rate-limit');

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  message: { error: 'Too many requests, please try again later.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 5, 
  message: { error: 'Too many login attempts, please try again later.' },
  skipSuccessfulRequests: true 
});

const apiKeyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 1000,
  keyGenerator: (req) => {
    return req.apiKey ? req.apiKey._id.toString() : req.ip;
  },
  message: { error: 'API rate limit exceeded' }
});

module.exports = { generalLimiter, authLimiter, apiKeyLimiter };