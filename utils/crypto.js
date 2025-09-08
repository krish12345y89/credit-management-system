const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { promisify } = require('util');

const randomBytes = promisify(crypto.randomBytes);

// Hash a password
async function hashPassword(password) {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

// Hash a token (for refresh tokens and API keys)
async function hashToken(token) {
  return await bcrypt.hash(token, 10);
}

// Compare a token with its hash
async function compareTokenHash(token, hash) {
  return await bcrypt.compare(token, hash);
}

// Generate a secure random string
async function generateRandomString(length) {
  const bytes = await randomBytes(Math.ceil(length / 2));
  return bytes.toString('hex').slice(0, length);
}

// Generate API key with prefix and secret
async function generateApiKey() {
  const prefix = await generateRandomString(8);
  const secret = await generateRandomString(32);
  return { fullKey: `${prefix}_${secret}`, prefix, secret };
}

module.exports = {
  hashPassword,
  hashToken,
  compareTokenHash,
  generateRandomString,
  generateApiKey
};