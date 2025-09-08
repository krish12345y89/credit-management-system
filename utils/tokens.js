const jwt = require('jsonwebtoken');
const { hashToken, generateRandomString } = require('./crypto');

// Generate JWT tokens
async function generateAccessToken(userId, role) {
  return jwt.sign(
    { sub: userId, role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRES }
  );
}

async function generateRefreshToken() {
  return generateRandomString(64);
}

// Verify JWT token
function verifyAccessToken(token) {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
}

// Calculate expiration date
async function calculateExpiry(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  calculateExpiry
};