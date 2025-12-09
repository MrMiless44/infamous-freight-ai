# 🚀 IMMEDIATE DEPLOYMENT STEPS (Start Here)

## RIGHT NOW - 15 Minutes to Live

### **STEP 1: Open Render.com Dashboard**

**Time: 1 minute**

1. Open browser → Go to **https://render.com**
2. Click **"Sign up"** (top right)
3. Choose **"Continue with GitHub"**
4. Authorize Render to access GitHub
5. You'll land on your Render Dashboard

---

### **STEP 2: Deploy Your App**

**Time: 5-10 minutes**

1. Click **"New +"** button (top right)
2. Select **"Blueprint"** from dropdown
3. You'll see "Connect your first repo"
4. Click **"Connect Account"** to link GitHub
5. Search for: **`infamous-freight-ai`**
6. Click the repo to select it
7. Click **"Connect"**

**Now you'll see your Render Blueprint Configuration:**
```
Services to Deploy:
  ✓ infamous-freight-web (Next.js Web App)
  ✓ infamous-freight-api (Node.js Express API)

Database to Create:
  ✓ infamous-freight-db (PostgreSQL 15)
```

8. **Click the green "Apply"** button
9. **Wait 5-10 minutes** for deployment

**You'll see:**
- 🔵 Services starting...
- 🟡 Database provisioning...
- 🟢 All services running (with green checkmarks)

---

### **STEP 3: Get Your Live URLs**

**Time: 1 minute**

Once deployment completes, you'll see:

- **API URL:** `https://infamous-freight-api.onrender.com`
- **Web URL:** `https://infamous-freight-web.onrender.com`

**Save these URLs!** You'll need them for Stripe.

---

### **STEP 4: Add Stripe Keys**

**Time: 3-5 minutes**

Now you need to add your Stripe payment keys to Render.

**First, get your Stripe keys:**

1. Open **https://dashboard.stripe.com**
2. Look for **"Developers"** menu (left sidebar)
3. Click **"API keys"**
4. You'll see two test keys:
   - **Secret Key** (starts with `sk_test_`)
   - **Publishable Key** (starts with `pk_test_`)
5. **Copy the Secret Key** (click the copy icon)

**Now add to Render:**

1. Go back to your **Render Dashboard**
2. Click on **`infamous-freight-api`** service
3. Click **"Environment"** tab
4. Click **"Add Environment Variable"**
5. Enter:
   - **Key:** `STRIPE_SECRET_KEY`
   - **Value:** Paste your `sk_test_*` key from above
6. Click **"Add"**
7. Repeat for webhook secret (see **STEP 5** below first)

---

### **STEP 5: Create Stripe Webhook**

**Time: 3-5 minutes**

Stripe needs to notify your API of payment events via webhooks.

1. Go back to **https://dashboard.stripe.com**
2. Click **"Developers"** → **"Webhooks"**
3. Click **"Add endpoint"**
4. Enter endpoint URL:
   ```
   https://infamous-freight-api.onrender.com/api/webhooks/stripe
   ```
   *(Replace with your actual API URL from STEP 3)*

5. Select events you want to receive:
   - ✅ `charge.succeeded`
   - ✅ `charge.failed`
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`
   - ✅ `customer.created`
   - ✅ `customer.deleted`

6. Click **"Add endpoint"**
7. You'll see a **Signing Secret** (starts with `whsec_`)
8. **Copy this Signing Secret**

---

### **STEP 6: Add Webhook Secret to Render**

**Time: 2 minutes**

1. Go back to **Render Dashboard** → **`infamous-freight-api`** → **Environment**
2. Click **"Add Environment Variable"**
3. Enter:
   - **Key:** `STRIPE_WEBHOOK_SECRET`
   - **Value:** Paste your `whsec_*` from STEP 5
4. Click **"Add"**

**Now click "Save"** at the bottom of Environment section.

**Wait 2-3 minutes** for Render to redeploy with the new keys.

---

### **STEP 7: Verify Everything Works**

**Time: 2 minutes**

**Test 1: API Health Check**
```
Open in browser or terminal:
https://infamous-freight-api.onrender.com/api/health

Should see:
{"status":"ok","timestamp":"2025-12-09T...","uptime":...}
```

**Test 2: Web Dashboard**
```
Open in browser:
https://infamous-freight-web.onrender.com

Should see your web app loading
```

**Test 3: Stripe Webhook**

1. Go to **https://dashboard.stripe.com** → **Developers** → **Webhooks**
2. Find your endpoint (the one you created in STEP 5)
3. Click on it
4. Scroll down to **"Recent events"**
5. Click **"Send test event"**
6. Select: `payment_intent.succeeded`
7. Click **"Send event"**
8. You should see a **green checkmark** ✅ for successful delivery

---

## 🎉 You're LIVE!

**Your app is now deployed and running in production!**

### What's Running:
- ✅ Web dashboard: `https://infamous-freight-web.onrender.com`
- ✅ API server: `https://infamous-freight-api.onrender.com`
- ✅ PostgreSQL database: Managed by Render
- ✅ Stripe integration: Ready to accept payments
- ✅ Webhooks: Configured and tested

---

## Next: Test a Real Payment (Optional)

1. Visit `https://infamous-freight-web.onrender.com`
2. Navigate to Pricing or Billing section
3. Try purchasing something with test card:
   - **Card Number:** `4242 4242 4242 4242`
   - **Expiry:** Any future date (e.g., `12/26`)
   - **CVC:** Any 3 digits (e.g., `123`)
4. Complete the payment
5. You should see success confirmation
6. Check **Stripe Dashboard** → **Payments** to see the transaction

---

## Troubleshooting

### "API not responding" 
- Wait another 2-3 minutes for redeploy to complete
- Check **Render Dashboard** → **Logs** tab for errors

### "Webhook not receiving events"
- Verify webhook secret in Render matches Stripe
- Check API logs in Render Dashboard
- Send test event in Stripe to verify

### "Database connection error"
- Render auto-creates PostgreSQL, nothing to do
- Check **Render Dashboard** → `infamous-freight-db` service status

---

## Support

- **Render Help:** https://render.com/support
- **Stripe Help:** https://support.stripe.com
- **GitHub Repo:** https://github.com/MrMiless44/infamous-freight-ai

---

**Ready to deploy? Start with STEP 1 above!** ⬆️
