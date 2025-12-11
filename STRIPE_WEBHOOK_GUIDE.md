# Stripe Webhook Integration

## Overview

Complete Stripe webhook implementation for Infamous Freight AI with automatic event processing, database integration, and comprehensive logging.

## Features

✅ **Secure signature verification** - Validates all webhooks using Stripe signing secrets  
✅ **Raw body parsing** - Proper request handling for signature validation  
✅ **Database integration** - Automatic tracking of payments, subscriptions, and invoices  
✅ **Event logging** - All events stored in `AiEvent` table for audit trail  
✅ **8+ event handlers** - Comprehensive coverage of payment lifecycle  
✅ **Error handling** - Graceful error recovery with detailed logging  

## Webhook Endpoint

**URL:** `https://infamous-freight-api.onrender.com/api/webhooks/stripe`

## Supported Events

| Event Type | Handler | Database Action |
|------------|---------|-----------------|
| `payment_intent.succeeded` | ✅ | Creates/updates Payment record |
| `payment_intent.payment_failed` | ✅ | Logs failed payment |
| `customer.subscription.created` | ✅ | Creates Subscription record |
| `customer.subscription.updated` | ✅ | Updates Subscription status |
| `customer.subscription.deleted` | ✅ | Marks subscription as canceled |
| `invoice.payment_succeeded` | ✅ | Creates/updates Invoice record |
| `invoice.payment_failed` | ✅ | Logs failed invoice with attempt count |
| `checkout.session.completed` | ✅ | Logs checkout completion |

## Setup Instructions

### 1. Configure Stripe Dashboard

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click **"Add endpoint"**
3. Enter URL: `https://infamous-freight-api.onrender.com/api/webhooks/stripe`
4. Select events to listen for:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `checkout.session.completed`
5. Click **"Add endpoint"**

### 2. Get Webhook Signing Secret

1. After creating the endpoint, click **"Reveal"** next to "Signing secret"
2. Copy the secret (starts with `whsec_...`)

### 3. Update Environment Variables

Add to your `.env` file or Render environment:

```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**For Render:**
- Go to Dashboard → infamous-freight-api → Environment
- Add/update `STRIPE_WEBHOOK_SECRET`
- Service will auto-redeploy

### 4. Run Database Migration

Apply the payment tables migration:

```bash
cd api
npx prisma migrate deploy
```

This creates:
- `Payment` table - Tracks individual payments
- `Subscription` table - Manages active subscriptions
- `Invoice` table - Records invoice payments/failures

## Database Schema

### Payment Table
```prisma
model Payment {
  id                    String   @id @default(cuid())
  userId                String?
  stripePaymentIntentId String   @unique
  amount                Int
  currency              String   @default("usd")
  status                String
  metadata              Json?
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}
```

### Subscription Table
```prisma
model Subscription {
  id                   String    @id @default(cuid())
  userId               String    @unique
  stripeSubscriptionId String    @unique
  stripeCustomerId     String
  status               String
  priceId              String
  currentPeriodStart   DateTime
  currentPeriodEnd     DateTime
  cancelAtPeriodEnd    Boolean   @default(false)
  canceledAt           DateTime?
  metadata             Json?
}
```

### Invoice Table
```prisma
model Invoice {
  id              String  @id @default(cuid())
  userId          String?
  subscriptionId  String?
  stripeInvoiceId String  @unique
  amountDue       Int
  amountPaid      Int
  currency        String  @default("usd")
  status          String
  attemptCount    Int     @default(0)
  metadata        Json?
}
```

## Testing

### Using Stripe Dashboard

1. Go to your webhook endpoint in Stripe Dashboard
2. Click **"Send test webhook"**
3. Select event type (e.g., `payment_intent.succeeded`)
4. Click **"Send test event"**
5. Check Render logs for processing confirmation

### Using Stripe CLI (Local Testing)

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward events to local server
stripe listen --forward-to localhost:4000/api/webhooks/stripe

# Trigger test events
stripe trigger payment_intent.succeeded
stripe trigger customer.subscription.created
```

### Check Logs

**Render:**
```
Logs → View Real-time Logs
```

Look for:
- `✅ Payment succeeded: pi_...`
- `🎉 New subscription created: sub_...`
- `💸 Invoice paid: in_...`

## Event Handler Examples

### Payment Intent Succeeded
```javascript
// Automatically creates Payment record
{
  stripePaymentIntentId: "pi_...",
  amount: 14900,
  currency: "usd",
  status: "succeeded",
  userId: "user_123" // from metadata
}
```

### Subscription Created
```javascript
// Automatically creates Subscription record
{
  stripeSubscriptionId: "sub_...",
  stripeCustomerId: "cus_...",
  status: "active",
  priceId: "price_...",
  currentPeriodEnd: "2025-01-10T00:00:00.000Z"
}
```

## Customization

### Adding Custom Logic

Edit `/api/src/services/stripe-webhook-handlers.js`:

```javascript
async function handlePaymentIntentSucceeded(paymentIntent) {
  // ... existing code ...
  
  // Add your custom logic here:
  
  // Send confirmation email
  await sendEmail({
    to: customer.email,
    subject: 'Payment Confirmed',
    template: 'payment-success',
    data: { amount, currency }
  });
  
  // Fulfill digital goods
  await provisionService(userId, productId);
  
  // Trigger onboarding
  await startOnboarding(userId);
  
  return { success: true, paymentIntentId: id };
}
```

### Passing User Context

Include user information in payment metadata:

```javascript
const paymentIntent = await stripe.paymentIntents.create({
  amount: 14900,
  currency: 'usd',
  metadata: {
    userId: 'user_123',
    planId: 'professional',
    source: 'web-app'
  }
});
```

The webhook will automatically link the payment to the user.

## Security

✅ **Signature verification** - All webhooks validated using Stripe signing secret  
✅ **Raw body parsing** - Prevents payload tampering  
✅ **Error isolation** - Failed events don't affect others  
✅ **Idempotency** - Upsert operations prevent duplicate records  

## Monitoring

### View Events in Database

```sql
-- Recent webhook events
SELECT * FROM "AiEvent" 
WHERE type LIKE 'payment%' OR type LIKE '%subscription%' 
ORDER BY "createdAt" DESC 
LIMIT 20;

-- Active subscriptions
SELECT * FROM "Subscription" 
WHERE status = 'active';

-- Recent payments
SELECT * FROM "Payment" 
ORDER BY "createdAt" DESC 
LIMIT 10;
```

### Stripe Dashboard

Monitor webhook delivery status:
- Dashboard → Webhooks → Select endpoint
- View delivery attempts, response codes, and retry history

## Troubleshooting

### Webhook signature verification failed

**Problem:** `⚠️ Webhook signature verification failed`

**Solution:**
1. Verify `STRIPE_WEBHOOK_SECRET` matches Dashboard value
2. Ensure environment variable is deployed to Render
3. Check that raw body middleware is configured correctly

### Events not being processed

**Problem:** Webhook receives events but doesn't update database

**Solution:**
1. Check Render logs for errors
2. Verify database connection is working
3. Ensure Prisma schema is up to date (`npx prisma migrate deploy`)

### Duplicate event processing

**Problem:** Same event processed multiple times

**Solution:**
- Handlers use `upsert` operations to prevent duplicates
- Stripe automatically handles idempotency
- Check for `stripePaymentIntentId` uniqueness

## Production Checklist

- [ ] Webhook endpoint configured in Stripe Dashboard
- [ ] `STRIPE_WEBHOOK_SECRET` set in production environment
- [ ] Database migrations applied
- [ ] Test webhook sends successful from Stripe Dashboard
- [ ] Logs showing successful event processing
- [ ] Email notifications configured (if needed)
- [ ] User provisioning logic implemented
- [ ] Error monitoring enabled (Sentry, etc.)

## Next Steps

1. **Implement email notifications** - Add SendGrid/Postmark for receipts
2. **User provisioning** - Auto-provision access on subscription creation
3. **Dunning management** - Handle failed payment retries
4. **Analytics** - Track revenue, churn, MRR metrics
5. **Admin dashboard** - View payments/subscriptions in UI

## Support

For issues or questions:
- Check [Stripe Webhook Documentation](https://stripe.com/docs/webhooks)
- Review Render logs for errors
- Test with Stripe CLI locally

---

**Status:** ✅ Production Ready  
**Last Updated:** December 10, 2025  
**Version:** 1.0.0
