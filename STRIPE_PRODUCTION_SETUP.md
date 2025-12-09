# 🔐 Stripe Production Setup Guide

## Step 1: Get Your Stripe Keys

### 1.1 Create Stripe Account
1. Go to https://stripe.com
2. Sign up with email
3. Verify email & set up account

### 1.2 Get Live Keys (Production)
1. Go to **Dashboard** → **Developers** → **API keys**
2. Toggle **View test data** to OFF (top right)
3. Copy **Secret key** (starts with `sk_live_`)
4. Copy **Publishable key** (starts with `pk_live_`)

### 1.3 Get Webhook Secret
1. Go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. URL: `https://infamous-freight-api.onrender.com/webhooks/stripe` (or your domain)
4. Events: Select `payment_intent.succeeded`, `payment_intent.failed`, `customer.subscription.updated`
5. Copy **Signing secret** (starts with `whsec_`)

---

## Step 2: Configure Render Production

### 2.1 Add Environment Variables

1. Go to **Render Dashboard** → **infamous-freight-api** service
2. Click **Environment**
3. Add these variables:

| Key | Value | Source |
|-----|-------|--------|
| `STRIPE_SECRET_KEY` | `sk_live_...` | Stripe Live Keys |
| `STRIPE_PUBLISHABLE_KEY` | `pk_live_...` | Stripe Live Keys |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Stripe Webhooks |
| `BILLING_CURRENCY` | `usd` | Default |
| `TRIAL_PERIOD_DAYS` | `14` | Default or customize |

4. Click **Save** (auto-redeploys)

### 2.2 Verify Webhook Delivery
1. Make a test payment in production
2. Go to **Stripe Dashboard** → **Webhooks** → Your endpoint
3. Confirm **Events** show successful deliveries (green checkmarks)

---

## Step 3: Test Production Payments

### 3.1 Test Card Numbers
Use these with **any** expiry/CVC for testing:

| Card Type | Number | Status |
|-----------|--------|--------|
| Visa | `4242 4242 4242 4242` | ✅ Success |
| Visa (decline) | `4000 0000 0000 0002` | ❌ Decline |
| 3D Secure | `4000 0025 0000 3155` | ✅ Requires auth |

**Expiry**: Any future date (e.g., `12/26`)  
**CVC**: Any 3 digits (e.g., `123`)

### 3.2 Test Flow
1. Open your web app `/pricing`
2. Click **Buy Starter** ($149/month)
3. Enter test card info
4. Confirm payment
5. Check Stripe Dashboard for payment intent

---

## Step 4: Enable 3D Secure (Recommended)

For compliance + fraud reduction:

1. **Stripe Dashboard** → **Settings** → **Payments**
2. **Authentication** → Enable **Automatic 3D Secure**
3. Threshold: $100+ (or customize)

This requires redirect to auth page for high-risk payments.

---

## Step 5: Set Up Webhooks for Production Events

### 5.1 Webhook Endpoints to Configure
1. `payment_intent.succeeded` → Credits user account
2. `payment_intent.failed` → Send retry email
3. `customer.subscription.updated` → Update billing status
4. `invoice.payment_failed` → Retry or disable service

### 5.2 Test Webhook Locally (Optional)
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local
stripe listen --forward-to localhost:4000/webhooks/stripe

# Trigger test event
stripe trigger payment_intent.succeeded
```

---

## Step 6: Monitor & Alert Setup

### 6.1 Stripe Alerts
1. **Dashboard** → **Settings** → **Alerts**
2. Enable:
   - Failed payment alerts
   - Declined card alerts
   - Chargeback alerts

### 6.2 Sentry Integration (Error Tracking)
1. Configure in `api/.env`:
   ```env
   SENTRY_DSN=your_sentry_dsn_here
   ```
2. Payment errors auto-report to Sentry

---

## Step 7: FAQ & Troubleshooting

### "Payment declined"
- Check card number (use test cards above)
- Verify `STRIPE_SECRET_KEY` is live key (`sk_live_`)
- Check **3D Secure** enabled for your card type

### "Webhook not triggering"
- Verify endpoint URL is correct
- Check **Events** tab for delivery logs
- Confirm `STRIPE_WEBHOOK_SECRET` matches

### "Test mode vs Live mode"
- **Test**: Use test keys (`sk_test_`, `pk_test_`)
- **Live**: Use live keys (`sk_live_`, `pk_live_`)
- Toggle in Stripe Dashboard top-right

### Subscription management
- Users can view/cancel subscriptions at `/account/subscriptions`
- Admins can manage via Stripe Dashboard

---

## Step 8: Revenue Tracking

Your app tracks:
- Monthly Recurring Revenue (MRR)
- Lifetime Value (LTV)
- Churn rate (cancellations)

**View in Analytics Dashboard** → `/dashboard` → Metrics section

---

## Live Checklist

- [ ] Stripe account created
- [ ] Live keys obtained
- [ ] Keys added to Render
- [ ] Webhook endpoint configured
- [ ] Test payment successful
- [ ] Webhook delivery confirmed
- [ ] 3D Secure enabled (optional)
- [ ] Alerts configured
- [ ] First real customer onboarded
- [ ] Revenue flowing to bank account

---

## Support

- **Stripe Docs**: https://stripe.com/docs
- **API Reference**: https://stripe.com/docs/api
- **Status**: https://status.stripe.com
