const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const RefreshTokenSchema = new mongoose.Schema({
  tokenHash: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
  replacedByTokenHash: String
});

const UserSchema = new mongoose.Schema({
  email: { 
    type: String, 
    unique: true, 
    required: true, 
    index: true,
    lowercase: true,
    trim: true
  },
  passwordHash: { type: String },
  name: { type: String, required: true, trim: true },
  role: { 
    type: String, 
    enum: ['user', 'admin', 'service'], 
    default: 'user' 
  },
  credits: { type: Number, default: 50, min: 0 },
  apiKeys: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ApiKey' }],
  refreshTokens: [RefreshTokenSchema],
  oauth: {
    googleId: String,
    githubId: String,
    accessToken: String,
    refreshToken: String
  },
  isActive: { type: Boolean, default: true },
  lastLogin: Date,
  createdAt: { type: Date, default: Date.now }
});

UserSchema.methods.checkPassword = async function(password) {
  return await bcrypt.compare(password, this.passwordHash);
};

module.exports = mongoose.model('User', UserSchema);
