const mongoose = require('mongoose');

const CreditTransactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { 
    type: String, 
    enum: ['signup_bonus', 'purchase', 'consumption', 'admin_adjustment'], 
    required: true 
  },
  amount: { type: Number, required: true },
  balanceAfter: { type: Number, required: true },
  description: String,
  reference: mongoose.Schema.Types.Mixed, // For Stripe payment IDs, etc.
  createdAt: { type: Date, default: Date.now, index: true }
});

module.exports = mongoose.model('CreditTransaction', CreditTransactionSchema);