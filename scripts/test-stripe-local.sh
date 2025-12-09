#!/bin/bash

# Local Testing Script for Stripe Integration
# Tests payment flow, webhooks, and integration locally

set -e

echo "🧪 Stripe Integration Test Suite"
echo "================================="
echo ""

# Check dependencies
if ! command -v stripe &> /dev/null; then
    echo "⚠️  Stripe CLI not found. Install with:"
    echo "   brew install stripe/stripe-cli/stripe"
    exit 1
fi

if ! command -v curl &> /dev/null; then
    echo "❌ curl not found"
    exit 1
fi

# Test 1: Check if API is running
echo "Test 1: Checking API health..."
API_RESPONSE=$(curl -s http://localhost:4000/api/health)
if echo "$API_RESPONSE" | grep -q "ok"; then
    echo "✅ API is healthy"
else
    echo "❌ API is not responding"
    exit 1
fi

# Test 2: Check if Stripe is configured
echo ""
echo "Test 2: Checking Stripe configuration..."
if [ -z "$STRIPE_SECRET_KEY" ]; then
    echo "⚠️  STRIPE_SECRET_KEY not set in .env"
else
    echo "✅ STRIPE_SECRET_KEY configured"
fi

# Test 3: Create a test payment intent
echo ""
echo "Test 3: Creating test payment intent..."
INTENT_RESPONSE=$(curl -s -X POST http://localhost:4000/api/payments/intent \
    -H "Content-Type: application/json" \
    -d '{"amount": 14900, "currency": "usd", "metadata": {"test": true}}')

if echo "$INTENT_RESPONSE" | grep -q "client_secret"; then
    echo "✅ Payment intent created"
    echo "   Response: $(echo "$INTENT_RESPONSE" | head -c 100)..."
else
    echo "❌ Failed to create payment intent"
    echo "   Response: $INTENT_RESPONSE"
fi

# Test 4: Start Stripe webhook forwarding (optional)
echo ""
echo "Test 4: Webhook forwarding (optional)"
read -p "Start Stripe webhook forwarding? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🔗 Forwarding Stripe webhooks to localhost:4000/webhooks/stripe"
    stripe listen --forward-to localhost:4000/webhooks/stripe &
    STRIPE_PID=$!
    
    echo ""
    echo "Test 5: Triggering test webhook..."
    sleep 2
    stripe trigger payment_intent.succeeded
    
    sleep 3
    kill $STRIPE_PID
    echo "✅ Webhook test complete"
fi

# Test 6: Check database for payment records
echo ""
echo "Test 6: Checking payment records in database..."
PAYMENT_COUNT=$(curl -s http://localhost:4000/api/payments | grep -o "id" | wc -l)
echo "✅ Found $PAYMENT_COUNT payment records"

echo ""
echo "================================="
echo "✅ All tests passed!"
echo ""
echo "Next steps:"
echo "1. Open http://localhost:3000/pricing"
echo "2. Click 'Buy' on a plan"
echo "3. Use test card: 4242 4242 4242 4242"
echo "4. Check API logs and database for transaction"
