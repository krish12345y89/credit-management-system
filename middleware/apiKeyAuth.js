const ApiKey = require('../models/ApiKey');
const { compareTokenHash } = require('../utils/crypto');
const auditLogger = require('../utils/auditLogger');

const apiKeyAuth = async (req, res, next) => {
  try {
    const apiKeyValue = req.headers['x-api-key'] || req.query.apiKey;
    
    if (!apiKeyValue) {
      return res.status(401).json({ error: 'API key required' });
    }
    
    const [prefix, secret] = apiKeyValue.split('_');
    
    if (!prefix || !secret) {
      return res.status(401).json({ error: 'Invalid API key format' });
    }
    
    const apiKey = await ApiKey.findOne({ prefix, revoked: false })
      .populate('owner');
    
    if (!apiKey) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      return res.status(401).json({ error: 'API key expired' });
    }
    
    const isValid = await compareTokenHash(secret, apiKey.keyHash);
    
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid API key' });
    }
    
    apiKey.lastUsedAt = new Date();
    await apiKey.save();
    
    req.apiKey = apiKey;
    req.user = apiKey.owner;
    
    await auditLogger.log('service', apiKey.owner._id.toString(), 'api_key_used', {
      apiKeyId: apiKey._id.toString(),
      endpoint: req.path,
      method: req.method
    }, req.ip, req.get('User-Agent'));
    
    next();
  } catch (error) {
    console.error('API key auth error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = apiKeyAuth;
