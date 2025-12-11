# 🚀 Production Deployment - Final Steps

Your code has been pushed to GitHub and Render will automatically deploy. Follow these steps to complete the production setup:

## Step 1: Configure Render Environment Variables

1. **Go to Render Dashboard:** https://dashboard.render.com/services
2. **Select `infamous-freight-api` service**
3. **Click "Environment" tab**
4. **Add/Update these variables:**

```
STRIPE_SECRET_KEY=sk_live_51SI7HQ...        (Your live secret key)
STRIPE_PUBLISHABLE_KEY=pk_live_51SI7HQ...  (Your live publishable key)
STRIPE_WEBHOOK_SECRET=whsec_...            (Will be from Stripe webhook config)
```

5. **Click "Save Changes"**
6. **Click "Manual Deploy"** (top right) to redeploy with new environment variables

**Wait for deployment to complete** (usually 2-5 minutes)

---

## Step 2: Configure Stripe Webhook Endpoint

1. **Go to Stripe Dashboard:** https://dashboard.stripe.com/webhooks
2. **Click "Add Endpoint"**
3. **Set Endpoint URL:**
   ```
   https://infamous-freight-api.onrender.com/api/webhooks/stripe
   ```
4. **Select Events** (all 8 required):
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`
   - ✅ `checkout.session.completed`

5. **Click "Create endpoint"**
6. **Copy the Signing Secret** (starts with `whsec_`)
7. **Update Render:** Go back to infamous-freight-api service and update `STRIPE_WEBHOOK_SECRET` with this value
8. **Click "Manual Deploy"** again

---

## Step 3: Verify Deployment

### Test Webhook in Stripe Dashboard
1. Go to https://dashboard.stripe.com/webhooks
2. Click your endpoint
3. **Click "Send test event"**
4. Select `payment_intent.succeeded`
5. **Should see green ✅ checkmark** indicating successful delivery

### Check Render Logs
1. Go to https://dashboard.render.com/services/infamous-freight-api
2. Click **"Logs"** tab
3. Look for webhook processing logs:
   ```
   💰 Processing successful payment: pi_...
   ✅ Payment record created
   ```

### Verify Database Records
Stripe webhook should have created records in your database. Check Render logs for confirmation.

---

## Step 4: Go Live

Once all tests pass:

1. **Update your web app** to use production Stripe Publishable Key
2. **Enable Live Mode** in your Stripe account
3. **Monitor webhook deliveries** in Stripe Dashboard
4. **Set up error alerts** (optional but recommended)

---

## ⚠️ Important Notes

- **Never commit production credentials** to git
- **Use Render's environment variable system** to manage secrets
- **Test webhooks** before accepting live payments
- **Keep Stripe webhook secret secure** - don't share in messages
- **Monitor logs** regularly for errors

---

## 🆘 Troubleshooting

If webhook isn't working:
1. Check Render logs for 400/500 errors
2. Verify webhook URL is correct (check for typos)
3. Verify STRIPE_WEBHOOK_SECRET matches Stripe Dashboard
4. Check database connection is working in Render logs
5. Ensure DATABASE_URL is set in Render environment

---

## ✅ Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] Render environment variables configured (STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY)
- [ ] Stripe webhook endpoint created
- [ ] STRIPE_WEBHOOK_SECRET updated in Render
- [ ] Render deployed with all variables
- [ ] Test webhook delivered successfully
- [ ] Database records created in production
- [ ] Web app updated to use live Stripe keys
- [ ] Ready for live transactions

---

**Questions?** Check logs at: https://dashboard.render.com/services/infamous-freight-api/logs
