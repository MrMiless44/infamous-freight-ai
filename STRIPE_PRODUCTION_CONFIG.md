STRIPE_SECRET_KEY=sk_live_51SI7HQ...
STRIPE_PUBLISHABLE_KEY=pk_live_51SI7HQ...
STRIPE_WEBHOOK_SECRET=whsec_test_bd...# Stripe Production Configuration Guide

## Step 1: Get Your Stripe Production Keys

### From Stripe Dashboard:
1. Go to https://dashboard.stripe.com
2. Click on **Settings** → **API keys**
3. Toggle to **Live keys** (if not already selected)
4. Copy your **Secret Key** (starts with `sk_live_`)
5. Copy your **Publishable Key** (starts with `pk_live_`)

**Example keys format:**
```
Secret Key:      sk_live_51SI7HQ...XXXXXX
Publishable Key: pk_live_51SI7HQ...XXXXXX
```

---

## Step 2: Configure Webhook Signing Secret

### From Stripe Dashboard:
1. Go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Enter endpoint URL: `https://infamous-freight-api.onrender.com/api/webhooks/stripe`
4. Select **Event types** to listen for:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `checkout.session.completed`
5. Click **Add endpoint**
6. Copy the **Signing secret** (starts with `whsec_`)

**Example:**
```
Signing Secret: whsec_test_bd...XXXXXX
```

---

## Step 3: Update Render Environment Variables

### Login to Render Dashboard:
1. Go to https://dashboard.render.com
2. Select your **infamous-freight-api** service
3. Click **Environment**

### Set These Variables:

| Key | Value | Source |
|-----|-------|--------|
| `STRIPE_SECRET_KEY` | `sk_live_51SI7HQ...` | Stripe Dashboard → API Keys |
| `STRIPE_PUBLISHABLE_KEY` | `pk_live_51SI7HQ...` | Stripe Dashboard → API Keys |
| `STRIPE_WEBHOOK_SECRET` | `whsec_test_bd...` | Stripe Dashboard → Webhooks |
| `SENTRY_DSN` | `https://xxxxx@sentry.io/xxxxx` | (Optional) Sentry Project Settings |
| `DATABASE_URL` | Already set (Prisma Accelerate) | Keep existing |
| `NODE_ENV` | `production` | Keep existing |
| `PORT` | `4000` | Keep existing |

### For Web Service:
Also update in **infamous-freight-web** environment:
| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_51SI7HQ...` |
| `NEXT_PUBLIC_API_BASE` | `https://infamous-freight-api.onrender.com` |

---

## Step 4: Redeploy Services

After setting environment variables:

1. In Render Dashboard, go to **infamous-freight-api**
2. Click **Manual Deploy** → **Deploy latest commit**
3. Wait for deployment to complete (check logs)
4. Verify webhook endpoint is accessible:
   ```bash
   curl -X POST https://infamous-freight-api.onrender.com/api/webhooks/stripe \
     -H "Content-Type: application/json" \
     -d '{"test": "ping"}'
   ```
   Expected: `{"error":"Missing signature"}` (401/400)

---

## Step 5: Test Production Webhook

### From Stripe Dashboard:
1. Go to **Developers** → **Webhooks**
2. Find your endpoint
3. Click **Send test event**
4. Select `payment_intent.succeeded`
5. Check **Response** column - should show ✅ green checkmark

### Verify in Render Logs:
1. Go to **infamous-freight-api** → **Logs**
2. Look for webhook processing logs:
   ```
   💰 Processing successful payment: pi_3Scz...
   ✅ Payment record created/updated: cmj0t...
   ```

---

## Step 6: Monitor Production Webhooks

### Ongoing Checklist:
- [ ] Test webhook in Stripe Dashboard (sends 200 response)
- [ ] Check Render logs for successful processing
- [ ] Verify database records created (Prisma Studio on Accelerate)
- [ ] Monitor error rates (Sentry if configured)
- [ ] Test payment flow end-to-end

### Example Production Log Output:
```
[req_1765420291525_q6ts28diw] POST /api/webhooks/stripe
💰 Processing successful payment: pi_3SczbZJBKY4ohJDA0Pwtqz8A
   Amount: 20 USD
   ✅ Payment record created/updated: cmj0tixno000eeslmz9c7nten
[req_1765420291525_q6ts28diw] 200 POST /webhooks/stripe 306ms
```

---

## Troubleshooting

### Webhook Not Receiving Events
- Verify endpoint URL matches exactly
- Check STRIPE_WEBHOOK_SECRET is correct
- Ensure API is deployed and running
- Check Stripe Dashboard webhook logs for errors

### Signature Validation Fails
- STRIPE_WEBHOOK_SECRET must be exact match
- Don't include quotes or extra spaces
- If changed, redeploy API immediately

### Database Not Recording
- Verify DATABASE_URL is set correctly
- Check Prisma migrations ran: `npx prisma migrate status`
- Monitor Render logs for Prisma errors

### Payment Events Not Processed
- Check NODE_ENV=production is set
- Verify API health: `curl https://infamous-freight-api.onrender.com/api/health`
- Review Stripe event logs for failed deliveries

---

## Security Best Practices

✅ **Do:**
- Store webhook secret in Render environment (not code)
- Use live keys only in production
- Keep test keys for local development
- Rotate webhook secret if compromised
- Monitor webhook delivery failures

❌ **Don't:**
- Commit API keys to git
- Share webhook secrets
- Use test keys in production
- Log sensitive payment data
- Disable webhook signature validation

---

## Next Steps

1. **Get your Stripe Live keys** from dashboard
2. **Add webhook endpoint** in Stripe Dashboard
3. **Copy webhook signing secret**
4. **Set Render environment variables** (above)
5. **Redeploy API** on Render
6. **Test webhook** from Stripe Dashboard
7. **Monitor logs** in Render dashboard
8. **Run production payment test** through your app

---

## Quick Reference

**Stripe Dashboard URLs:**
- API Keys: https://dashboard.stripe.com/apikeys
- Webhooks: https://dashboard.stripe.com/webhooks
- Events: https://dashboard.stripe.com/events

**Render Dashboard URLs:**
- Services: https://dashboard.render.com
- API Logs: https://dashboard.render.com/[service-id]/logs
- Environment: https://dashboard.render.com/[service-id]/env

**Local Testing:**
```bash
# Test webhook locally
stripe listen --forward-to http://localhost:4002/api/webhooks/stripe

# Trigger test event
stripe trigger payment_intent.succeeded
```

---

**Status:** Ready for production deployment ✅
