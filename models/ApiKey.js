const mongoose = require('mongoose');

const ApiKeySchema = new mongoose.Schema({
  name: { type: String, required: true },
  keyHash: { type: String, required: true },
  prefix: { type: String, required: true },
  scopes: [{ type: String, enum: ['read', 'write', 'delete'] }],
  revoked: { type: Boolean, default: false },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  lastUsedAt: Date,
  expiresAt: Date
});

module.exports = mongoose.model('ApiKey', ApiKeySchema);
