# ⚡ Quick Reference - 30 Minute Launch Guide

## 🎯 Your Mission: Complete 5 Steps in 30 Minutes

---

## Step 1️⃣ Sentry Account (5 min)
```
1. Open: https://sentry.io
2. Click Sign Up
3. Create account with your email
4. Create new Node.js project
5. COPY your DSN (looks like: https://xxxxx@sentry.io/1234567)
6. SAVE it somewhere safe ✅
```

---

## Step 2️⃣ Add to Render (5 min)
```
1. Open: https://dashboard.render.com
2. Click: infamous-freight-api service
3. Click: Environment tab
4. Click: Add Environment Variable
5. Key: SENTRY_DSN
6. Value: PASTE your DSN from Step 1
7. Click: Save ✅
```

---

## Step 3️⃣ Deploy (5 min)
```
1. In Render: Click Deploy tab
2. Click: Manual Deploy button
3. Wait: 3-5 minutes
4. Status: Should change to "Live" ✅
```

---

## Step 4️⃣ Verify (10 min)

### Test 1: API Health
```
Open: https://infamous-freight-api.onrender.com/api/health
Should see: {"ok":true,"service":"api"}
✅ If you see this, API is responding!
```

### Test 2: Send Webhook
```
1. Open: https://dashboard.stripe.com/webhooks
2. Click your endpoint
3. Send test event: payment_intent.succeeded
4. Look for: ✅ Green checkmark
✅ If green, webhook delivery works!
```

### Test 3: Check Sentry
```
1. Open: https://sentry.io
2. Go to your project
3. Look for: Connected status
4. See events/errors captured
✅ If you see data, Sentry works!
```

### Test 4: Check Render Logs
```
1. Open: https://dashboard.render.com
2. Click: infamous-freight-api
3. Click: Logs tab
4. Look for: "💰 Processing successful payment"
✅ If you see this, webhooks are processing!
```

---

## Step 5️⃣ Optional: Redis Caching (5 min)
```
SKIP THIS if you just want to launch.
ADD THIS LATER for ~40% faster responses.

If doing it now:
1. Open: https://redis.com/try-free/
2. Create account & database
3. Copy Redis connection URL
4. In Render → Environment → Add Variable
5. Key: REDIS_URL
6. Value: Paste your Redis URL
7. Manual Deploy again
✅ Caching enabled!
```

---

## ✅ Success Checklist

- [ ] Created Sentry account
- [ ] Got DSN and saved it
- [ ] Added SENTRY_DSN to Render
- [ ] Clicked Manual Deploy
- [ ] Deploy shows "Live"
- [ ] Health check returns JSON
- [ ] Webhook test shows ✅ green check
- [ ] Sentry shows "Connected"
- [ ] Render logs show payment processing
- [ ] Optional: Redis configured

---

## 🆘 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Can't find DSN | → Sentry Dashboard → Your Project → Settings → Client Keys |
| Deploy stuck | → Wait 5 more min OR Clear Build Cache → redeploy |
| API returns 404 | → Wait for deploy to finish, refresh page |
| Webhook red X | → Check endpoint URL in Stripe → Check STRIPE_WEBHOOK_SECRET exists |
| Sentry no data | → Wait 30 sec, send another webhook, refresh |

---

## 📱 URLs Cheat Sheet

```
Sentry:          https://sentry.io
Render:          https://dashboard.render.com
Stripe:          https://dashboard.stripe.com
Your API:        https://infamous-freight-api.onrender.com/api/health
Redis (opt):     https://redis.com/try-free/
```

---

## ⏱️ Time Budget

| Step | Time | Running Total |
|------|------|---------------|
| 1: Sentry | 5 min | 5 min |
| 2: Render | 5 min | 10 min |
| 3: Deploy | 5 min | 15 min |
| 4: Verify | 10 min | 25 min |
| 5: Redis (opt) | 5 min | 30 min |

**Total: 30 minutes to launch! 🚀**

---

## 🎉 What You Get After 30 Minutes

✅ Error tracking with Sentry  
✅ Real-time API monitoring  
✅ Webhook delivery verified  
✅ Database processing confirmed  
✅ Production system live  
✅ Optional: Redis caching  

---

## 🚀 You're Ready!

**Start with Step 1 → https://sentry.io → Create Account**

**Come back here for each step. Follow the steps in order.**

**Questions?** Check `COMPLETE_ACTION_PLAN.md` for detailed help on each step.

---

**Estimated Time to Launch: 30 minutes**  
**Difficulty: Easy (mostly clicking and copying)**  
**Status: All code ready, just needs configuration**

**LET'S SHIP IT! 🚀**
