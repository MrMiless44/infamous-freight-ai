# 🎯 DEPLOYMENT QUICK REFERENCE CARD

## Print This or Keep Open During Deployment

---

## PHASE 1: RENDER BLUEPRINT DEPLOYMENT

**Time: 15 minutes**

### URLs to Use
```
Repo: https://github.com/MrMiless44/infamous-freight-ai
Render: https://render.com
GitHub Auth: https://github.com/login/oauth/authorize
```

### 8 Actions
1. ➡️ Go to https://render.com → Sign up with GitHub
2. ➡️ Click "New +" → "Blueprint"
3. ➡️ Search & select: infamous-freight-ai
4. ➡️ Click "Apply"
5. ➡️ **WAIT 5-10 minutes** for deployment
6. ➡️ Copy your API URL (infamous-freight-api.onrender.com)
7. ➡️ Copy your Web URL (infamous-freight-web.onrender.com)
8. ➡️ Save both URLs for Stripe setup

### What You'll See
```
🟡 Building images...
🟡 Creating database...
🟢 All services running ✓
```

---

## PHASE 2: STRIPE CONFIGURATION

**Time: 10 minutes**

### Get Stripe Keys
1. ➡️ Go to https://dashboard.stripe.com
2. ➡️ Click "Developers" (left sidebar)
3. ➡️ Click "API keys"
4. ➡️ Copy **Secret Key** (sk_test_...)

### Create Webhook
1. ➡️ Go to https://dashboard.stripe.com
2. ➡️ Click "Developers" → "Webhooks"
3. ➡️ Click "Add endpoint"
4. ➡️ Paste endpoint URL:
   ```
   https://infamous-freight-api.onrender.com/api/webhooks/stripe
   ```
5. ➡️ Select events: charge.*, payment_intent.*, customer.*
6. ➡️ Click "Add endpoint"
7. ➡️ Copy **Signing Secret** (whsec_...)

### Add Keys to Render
1. ➡️ Render Dashboard → infamous-freight-api → Environment
2. ➡️ Click "Add Environment Variable"
3. ➡️ Add STRIPE_SECRET_KEY with sk_test_*
4. ➡️ Click "Add"
5. ➡️ Click "Add Environment Variable"
6. ➡️ Add STRIPE_WEBHOOK_SECRET with whsec_*
7. ➡️ Click "Save"
8. ➡️ **WAIT 2-3 minutes** for redeploy

---

## PHASE 3: VERIFICATION

**Time: 5 minutes**

### Test API Health
```
Open in browser:
https://infamous-freight-api.onrender.com/api/health

Expected: {"status":"ok",...}
```

### Test Web Dashboard
```
Open in browser:
https://infamous-freight-web.onrender.com

Expected: Web page loads
```

### Test Stripe Webhook
1. ➡️ Stripe Dashboard → Developers → Webhooks
2. ➡️ Click your endpoint
3. ➡️ Click "Send test event"
4. ➡️ Select "payment_intent.succeeded"
5. ➡️ Click "Send event"
6. ➡️ Expected: Green checkmark ✅

---

## CRITICAL URLS

### Render
- Dashboard: https://render.com/dashboard
- Your API: https://infamous-freight-api.onrender.com
- Your Web: https://infamous-freight-web.onrender.com

### Stripe
- Dashboard: https://dashboard.stripe.com
- API Keys: https://dashboard.stripe.com/test/apikeys
- Webhooks: https://dashboard.stripe.com/test/webhooks

### GitHub
- Repo: https://github.com/MrMiless44/infamous-freight-ai

---

## STRIPE KEYS FORMAT

### What to Copy (Render Environment Variables)

| Variable | Example | Where From |
|----------|---------|-----------|
| STRIPE_SECRET_KEY | `sk_test_abc123...` | https://dashboard.stripe.com/test/apikeys |
| STRIPE_WEBHOOK_SECRET | `whsec_abc123...` | https://dashboard.stripe.com/test/webhooks (after creating endpoint) |

---

## COMMON ISSUES & FIXES

### API Not Responding After 5 mins
```
✓ Wait another 2 minutes
✓ Check Render Logs: Dashboard → Logs tab
✓ Look for error messages
```

### Webhook Not Receiving Events
```
✓ Verify endpoint URL is correct in Stripe
✓ Verify secret matches in Render env
✓ Check Render API logs for errors
✓ Try sending test event again
```

### Services Won't Start
```
✓ Check Render logs for error details
✓ Verify DATABASE_URL is set (auto-done by Render)
✓ Verify all env vars are present
```

---

## SUCCESS CHECKLIST

After deployment, verify:

- [ ] API responds to health check (HTTP 200)
- [ ] Web dashboard loads in browser
- [ ] Stripe webhook endpoint created
- [ ] Webhook signing secret in Render
- [ ] Test webhook delivery shows green checkmark
- [ ] Render logs show no errors

---

## NEXT STEPS AFTER GOING LIVE

1. **Test a payment** (use card 4242 4242 4242 4242)
2. **Monitor logs** daily for first week
3. **Document** any issues found
4. **Switch to live Stripe keys** when ready
5. **Update DNS** if using custom domain

---

## ESTIMATED TIMELINE

- Render Deployment: 10-15 minutes
- Stripe Setup: 5-10 minutes
- Verification: 5 minutes
- **Total: 20-30 minutes to LIVE** 🚀

---

## EMERGENCY CONTACTS

- **Render Support**: https://render.com/support
- **Stripe Support**: https://support.stripe.com
- **GitHub Issues**: https://github.com/MrMiless44/infamous-freight-ai/issues

---

**Status: READY FOR DEPLOYMENT ✅**

Start with Phase 1 above!
