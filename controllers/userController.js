const User = require('../models/User');
const CreditTransaction = require('../models/CreditTransaction');
const auditLogger = require('../utils/auditLogger');

// Get user profile
async function getProfile(req, res) {
  try {
    const user = await User.findById(req.user._id).select('-passwordHash -refreshTokens');
    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Get credit balance
async function getCredits(req, res) {
  try {
    const user = await User.findById(req.user._id).select('credits');
    res.json({ credits: user.credits });
  } catch (error) {
    console.error('Get credits error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Upload file (consumes credits)
async function uploadFile(req, res) {
  try {
    const COST = 10;
    const user = await User.findById(req.user._id);
    
    if (user.credits < COST) {
      return res.status(402).json({ error: 'Insufficient credits' });
    }
    
    // skipped for this time
    
    // Deduct credits
    user.credits -= COST;
    await user.save();
    
    // Log credit transaction
    const creditTransaction = new CreditTransaction({
      userId: user._id,
      type: 'consumption',
      amount: -COST,
      balanceAfter: user.credits,
      description: 'File upload'
    });
    
    await creditTransaction.save();
    
    // Log audit event
    await auditLogger.log('user', user._id.toString(), 'file_upload', {
      cost: COST,
      creditsRemaining: user.credits
    }, req.ip, req.get('User-Agent'));
    
    res.json({ 
      message: 'File uploaded successfully', 
      credits: user.credits,
      fileId: `file_${Date.now()}`
    });
  } catch (error) {
    console.error('Upload file error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Generate report (consumes credits)
async function generateReport(req, res) {
  try {
    const COST = 5;
    const user = await User.findById(req.user._id);
    
    if (user.credits < COST) {
      return res.status(402).json({ error: 'Insufficient credits' });
    }
    
    // Deduct credits
    user.credits -= COST;
    await user.save();
    
    // Log credit transaction
    const creditTransaction = new CreditTransaction({
      userId: user._id,
      type: 'consumption',
      amount: -COST,
      balanceAfter: user.credits,
      description: 'Report generation'
    });
    
    await creditTransaction.save();
    
    // Log audit event
    await auditLogger.log('user', user._id.toString(), 'report_generated', {
      cost: COST,
      creditsRemaining: user.credits
    }, req.ip, req.get('User-Agent'));
    
    res.json({ 
      message: 'Report generated successfully', 
      credits: user.credits,
      reportId: `report_${Date.now()}`
    });
  } catch (error) {
    console.error('Generate report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Get credit transactions
async function getCreditTransactions(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const transactions = await CreditTransaction.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await CreditTransaction.countDocuments({ userId: req.user._id });
    
    res.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get credit transactions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  getProfile,
  getCredits,
  uploadFile,
  generateReport,
  getCreditTransactions
};