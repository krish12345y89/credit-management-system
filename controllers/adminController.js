const User = require('../models/User');
const ApiKey = require('../models/ApiKey');
const CreditTransaction = require('../models/CreditTransaction');
const Audit = require('../models/Audit');
const { generateApiKey, hashToken } = require('../utils/crypto');
const { calculateExpiry } = require('../utils/tokens');
const auditLogger = require('../utils/auditLogger');

// Add credits to a user
async function addCredits(req, res) {
  try {
    const { userId, amount } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Add credits
    user.credits += amount;
    await user.save();
    
    // Log credit transaction
    const creditTransaction = new CreditTransaction({
      userId: user._id,
      type: 'admin_adjustment',
      amount: amount,
      balanceAfter: user.credits,
      description: `Admin credit adjustment by ${req.user.email}`
    });
    
    await creditTransaction.save();
    
    // Log audit event
    await auditLogger.log('admin', req.user._id.toString(), 'credits_added', {
      targetUserId: userId,
      amount: amount,
      newBalance: user.credits
    }, req.ip, req.get('User-Agent'));
    
    res.json({ 
      message: 'Credits added successfully', 
      credits: user.credits 
    });
  } catch (error) {
    console.error('Add credits error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Create API key for a user
async function createApiKey(req, res) {
  try {
    const { name, scopes, expiresInDays ,user} = req.body;
    const userId = req.user._id;
    
    // Generate API key
    const { fullKey, prefix, secret } = await generateApiKey();
    const keyHash = await hashToken(secret);
    const expiresAt = await calculateExpiry(expiresInDays);
    
    // Create API key record
    const apiKey = new ApiKey({
      name,
      keyHash,
      prefix,
      scopes,
      owner: user,
      expiresAt
    });
    
    await apiKey.save();
    
    // Add API key to user
    await User.findByIdAndUpdate(user, {
      $push: { apiKeys: apiKey._id }
    });
    
    // Log audit event
    await auditLogger.log('admin', user.toString(), 'api_key_created', {
      apiKeyId: apiKey._id.toString(),
      name,
      scopes,
      expiresAt
    }, req.ip, req.get('User-Agent'));
    
    // Return the full key (only shown once)
    res.status(201).json({
      message: 'API key created successfully',
      apiKey: fullKey,
      apiKeyId: apiKey._id,
      expiresAt
    });
  } catch (error) {
    console.error('Create API key error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Revoke API key
async function revokeApiKey(req, res) {
  try {
    const { apiKeyId ,user} = req.body;
    
    const apiKey = await ApiKey.findById(apiKeyId);
    if (!apiKey) {
      return res.status(404).json({ error: 'API key not found' });
    }
    
    // Check if the admin owns this API key or has permission to revoke it
    if (apiKey.owner.toString() !== user.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to revoke this API key' });
    }
    
    // Revoke the API key
    apiKey.revoked = true;
    await apiKey.save();
    
    // Log audit event
    await auditLogger.log('admin', user.toString(), 'api_key_revoked', {
      apiKeyId: apiKey._id.toString()
    }, req.ip, req.get('User-Agent'));
    
    res.json({ message: 'API key revoked successfully' });
  } catch (error) {
    console.error('Revoke API key error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Get audit logs
async function getAuditLogs(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    
    const filters = {};
    
    // Filter by actor type if provided
    if (req.query.actorType) {
      filters.actorType = req.query.actorType;
    }
    
    // Filter by action if provided
    if (req.query.action) {
      filters.action = req.query.action;
    }
    
    // Filter by date range if provided
    if (req.query.startDate || req.query.endDate) {
      filters.createdAt = {};
      
      if (req.query.startDate) {
        filters.createdAt.$gte = new Date(req.query.startDate);
      }
      
      if (req.query.endDate) {
        filters.createdAt.$lte = new Date(req.query.endDate);
      }
    }
    
    const logs = await Audit.find(filters)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Audit.countDocuments(filters);
    
    res.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Get all users
async function getUsers(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const users = await User.find({})
      .select('-passwordHash -refreshTokens')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await User.countDocuments();
    
    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  addCredits,
  createApiKey,
  revokeApiKey,
  getAuditLogs,
  getUsers
};