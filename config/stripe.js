const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);


// Verify Stripe webhook signature
const verifyWebhook = (req, secret) => {
  const signature = req.headers['stripe-signature'];
  
  try {
    return stripe.webhooks.constructEvent(req.body, signature, secret);
  } catch (err) {
    throw new Error(`Webhook signature verification failed: ${err.message}`);
  }
};

module.exports = {
  stripe,
  verifyWebhook
};