const rateLimit = require('express-rate-limit');

// General rate limiter
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' }
});

// Strict limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login attempts per windowMs
  message: { error: 'Too many login attempts, please try again later.' },
  skipSuccessfulRequests: true // don't count successful requests
});

// API key rate limiting
const apiKeyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // higher limit for API keys
  keyGenerator: (req) => {
    return req.apiKey ? req.apiKey._id.toString() : req.ip;
  },
  message: { error: 'API rate limit exceeded' }
});

module.exports = { generalLimiter, authLimiter, apiKeyLimiter };