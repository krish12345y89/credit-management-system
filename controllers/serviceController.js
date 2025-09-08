const User = require('../models/User');
const CreditTransaction = require('../models/CreditTransaction');
const auditLogger = require('../utils/auditLogger');

async function getUserMetadata(req, res) {
  try {
    const { userId } = req.params;
    
    if (!req.apiKey.scopes.includes('read')) {
      return res.status(403).json({ error: 'Insufficient scope' });
    }
    
    // Find user
    const user = await User.findById(userId).select('-passwordHash -refreshTokens');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (req.apiKey.owner._id.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const recentTransactions = await CreditTransaction.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10);
    
    res.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        credits: user.credits,
        createdAt: user.createdAt
      },
      recentTransactions
    });
  } catch (error) {
    console.error('Get user metadata error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function getUserReports(req, res) {
  try {
    const { userId } = req.params;
    
    if (!req.apiKey.scopes.includes('read')) {
      return res.status(403).json({ error: 'Insufficient scope' });
    }
    
    const user = await User.findById(userId);
    if (user.credits < COST) {
      return res.status(402).json({ error: 'Insufficient credits' });
    }
    
    user.credits -= COST;
    await user.save();
    
    // Log credit transaction
    const creditTransaction = new CreditTransaction({
      userId: user._id,
      type: 'consumption',
      amount: -COST,
      balanceAfter: user.credits,
      description: 'API call: get user reports'
    });
    
    await creditTransaction.save();
    
    await auditLogger.log('service', req.apiKey._id.toString(), 'api_report_access', {
      targetUserId: userId,
      cost: COST,
      creditsRemaining: user.credits
    }, req.ip, req.get('User-Agent'));
    
    const mockReports = [
      {
        id: 'report_001',
        name: 'Monthly Usage Report',
        generatedAt: new Date(Date.now() - 86400000), 
        downloadUrl: `/api/reports/report_001/download`
      },
      {
        id: 'report_002',
        name: 'Quarterly Analytics',
        generatedAt: new Date(Date.now() - 2592000000),
        downloadUrl: `/api/reports/report_002/download`
      }
    ];
    
    res.json({
      reports: mockReports,
      credits: user.credits
    });
  } catch (error) {
    console.error('Get user reports error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  getUserMetadata,
  getUserReports
};