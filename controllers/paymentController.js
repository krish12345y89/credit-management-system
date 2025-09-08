const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User');
const CreditTransaction = require('../models/CreditTransaction');
const auditLogger = require('../utils/auditLogger');

async function createCheckoutSession(req, res) {
  try {
    let { credits, amount, currency = 'usd' } = req.body;
    const userId = req.user._id;
    
    if (!credits || !amount) {
      return res.status(400).json({ error: 'Credits and amount are required' });
    }
    
    if (amount < 50) { // Minimum $0.50
      return res.status(400).json({ error: 'Amount must be at least $0.50' });
    }
    credits=amount*10;
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: `${credits} Credits`,
              description: `Purchase ${credits} credits for the SaaS platform`
            },
            unit_amount: amount, 
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `http://127.0.0.1:5500/public/success.html`,
      cancel_url: `http://127.0.0.1:5500/public/cancel.html`,
      client_reference_id: userId.toString(),
      metadata: {
        userId: userId.toString(),
        credits: credits.toString()
      }
    });
    
    // Log audit event
    await auditLogger.log('user', userId.toString(), 'checkout_session_created', {
      sessionId: session.id,
      credits,
      amount,
      currency
    }, req.ip, req.get('User-Agent'));
    
    res.json({ 
      sessionId: session.id, 
      url: session.url 
    });
  } catch (error) {
    console.error('Create checkout session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleWebhook(req, res) {
  try {
    const sig = req.headers['stripe-signature'];
    let event;
    
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      
      const userId = session.metadata.userId;
      const credits = parseInt(session.metadata.credits, 10);
      const amount = session.amount_total; 
      
      const user = await User.findById(userId);
      if (!user) {
        console.error('User not found for webhook:', userId);
        return res.status(404).json({ error: 'User not found' });
      }
  
      user.credits += credits;
      await user.save();
      
      const creditTransaction = new CreditTransaction({
        userId: user._id,
        type: 'purchase',
        amount: credits,
        balanceAfter: user.credits,
        description: `Credit purchase via Stripe`,
        reference: {
          sessionId: session.id,
          paymentIntentId: session.payment_intent,
          amount: amount / 100 // Convert cents to dollars
        }
      });
      
      await creditTransaction.save();
      
      // Log audit event
      await auditLogger.log('service', userId, 'credits_purchased', {
        sessionId: session.id,
        credits,
        amount: amount / 100,
        newBalance: user.credits
      });
      
      console.log(`Added ${credits} credits to user ${user.email}`);
    }
    
    res.json({ received: true });
  } catch (error) {
    console.error('Webhook handling error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function getPaymentHistory(req, res) {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const transactions = await CreditTransaction.find({ 
      userId, 
      type: 'purchase' 
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await CreditTransaction.countDocuments({ 
      userId, 
      type: 'purchase' 
    });
    
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
    console.error('Get payment history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  createCheckoutSession,
  handleWebhook,
  getPaymentHistory
};