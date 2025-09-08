const mongoose = require('mongoose');

const AuditSchema = new mongoose.Schema({
  actorType: { 
    type: String, 
    enum: ['user', 'admin', 'service'], 
    required: true 
  },
  actorId: { type: String, required: true },
  action: { type: String, required: true },
  resourceType: String,
  resourceId: String,
  details: mongoose.Schema.Types.Mixed,
  ipAddress: String,
  userAgent: String,
  createdAt: { type: Date, default: Date.now, index: true }
});

module.exports = mongoose.model('Audit', AuditSchema);
