#!/usr/bin/env node
/**
 * Test Stripe webhook locally without Stripe CLI
 * This simulates a webhook event for development testing
 */

const mockStripeEvent = {
  id: 'evt_test_webhook',
  object: 'event',
  api_version: '2023-10-16',
  created: Math.floor(Date.now() / 1000),
  data: {
    object: {
      id: 'pi_test_12345',
      object: 'payment_intent',
      amount: 14900,
      currency: 'usd',
      status: 'succeeded',
      customer: 'cus_test_123',
      metadata: {
        order_id: 'order_123'
      }
    }
  },
  livemode: false,
  pending_webhooks: 1,
  request: {
    id: null,
    idempotency_key: null
  },
  type: 'payment_intent.succeeded'
};

console.log('\n🧪 Testing Stripe Webhook Locally\n');
console.log('Mock Event:', JSON.stringify(mockStripeEvent, null, 2));
console.log('\n⚠️  Note: This bypasses signature verification.');
console.log('For production testing, use Stripe CLI or ngrok.\n');

// Make a POST request to the local webhook endpoint
fetch('http://localhost:4000/api/webhooks/stripe', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    // Mock signature - will fail verification if STRIPE_WEBHOOK_SECRET is set
    'stripe-signature': 't=1234567890,v1=mock_signature_for_testing'
  },
  body: JSON.stringify(mockStripeEvent)
})
  .then(res => res.json())
  .then(data => {
    console.log('✅ Response:', data);
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
  });
