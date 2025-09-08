const Audit = require('../models/Audit');

async function log(actorType, actorId, action, details, ipAddress, userAgent) {
  try {
    const auditEntry = new Audit({
      actorType,
      actorId,
      action,
      details,
      ipAddress,
      userAgent
    });
    
    await auditEntry.save();
    return auditEntry;
  } catch (error) {
    console.error('Audit logging failed:', error);
    // Don't throw error as we don't want to break the main functionality
  }
}

module.exports = { log };