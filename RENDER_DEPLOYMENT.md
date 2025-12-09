# 🚀 RENDER DEPLOYMENT BLUEPRINT - READY

## Your render.yaml Configuration

**Status:** ✅ COMMITTED AND READY  
**Location:** `/render.yaml` in repository root  
**Last Updated:** December 9, 2025  

---

## **WHAT RENDER WILL DEPLOY**

### **Service 1: Web Application**
```yaml
Name: infamous-freight-web
Type: Web Service (Docker)
Port: 3000
Dockerfile: ./web/Dockerfile
Health Check: /
Environment: Production
```

**What it does:**
- Builds Next.js web dashboard
- Serves frontend on port 3000
- Auto-scales based on traffic
- HTTPS + global CDN included

---

### **Service 2: API Server**
```yaml
Name: infamous-freight-api
Type: Web Service (Docker)
Port: 4000
Dockerfile: ./api/Dockerfile
Health Check: /api/health
Environment: Production
```

**What it does:**
- Builds Express API server
- Connects to PostgreSQL database
- Generates JWT_SECRET automatically
- Ready for Stripe webhooks

---

### **Service 3: Database**
```yaml
Name: infamous-freight-db
Type: PostgreSQL Database
Version: 15
Storage: Included with starter plan
Connection String: Auto-generated
```

**What it does:**
- Provisions PostgreSQL 15 instance
- Creates `infamous_freight` database
- Sets up `infamous` user
- Provides connection string to API

---

## **ENVIRONMENT VARIABLES - AUTO-CONFIGURED**

| Variable | Source | Value |
|----------|--------|-------|
| `NODE_ENV` | Static | `production` |
| `PORT` (API) | Static | `4000` |
| `PORT` (Web) | Static | `3000` |
| `JWT_SECRET` | Generated | Auto-created (do not edit) |
| `AI_SYNTHETIC_API_KEY` | Generated | Auto-created (do not edit) |
| `DATABASE_URL` | Database | Auto-linked from PostgreSQL |
| `CORS_ORIGINS` | Static | `https://infamous-freight-web.onrender.com` |
| `STRIPE_SECRET_KEY` | Manual | You add after deployment |
| `STRIPE_WEBHOOK_SECRET` | Manual | You add after deployment |

---

## **MANUAL CONFIGURATION AFTER DEPLOYMENT**

After Render finishes deploying (5-10 minutes), you'll need to add:

1. **STRIPE_SECRET_KEY**
   - Get from: https://dashboard.stripe.com → Developers → API Keys
   - Value: `sk_test_...` (test mode) or `sk_live_...` (production)
   - Add to: Render Dashboard → infamous-freight-api → Environment

2. **STRIPE_WEBHOOK_SECRET**
   - Get from: Stripe Dashboard → Developers → Webhooks → Your Endpoint
   - Value: `whsec_...`
   - Add to: Render Dashboard → infamous-freight-api → Environment

---

## **DEPLOYMENT FLOW**

```
1. You click "Apply" on Render
   ↓
2. Render reads render.yaml from GitHub
   ↓
3. Render builds 3 Docker images:
   - web/Dockerfile → infamous-freight-web
   - api/Dockerfile → infamous-freight-api
   ↓
4. Render provisions PostgreSQL 15
   ↓
5. Render deploys all 3 services
   ↓
6. Services start with auto-generated secrets
   ↓
7. Health checks verify services are running
   ↓
8. Your URLs are ready:
   - https://infamous-freight-web.onrender.com
   - https://infamous-freight-api.onrender.com
   ↓
9. You add Stripe keys manually
   ↓
10. Services redeploy with Stripe config
   ↓
11. You test everything
   ↓
12. App is LIVE! 🎉
```

---

## **HEALTH CHECKS**

Render automatically monitors your services:

- **API:** `GET https://infamous-freight-api.onrender.com/api/health`
  - Must return `{"ok": true, ...}`
  - Checked every 30 seconds

- **Web:** `GET https://infamous-freight-web.onrender.com/`
  - Must return HTTP 200
  - Checked every 30 seconds

If health checks fail, services are restarted automatically.

---

## **PRICING (Starter Plan)**

| Service | Cost | Details |
|---------|------|---------|
| Web (infamous-freight-web) | Free | Limited to 0.5 CPU, 512 MB RAM |
| API (infamous-freight-api) | Free | Limited to 0.5 CPU, 512 MB RAM |
| PostgreSQL 15 | Free | 256 MB storage included |
| **Total** | **Free** | Full SaaS running free tier |

---

## **AUTO-DEPLOY ON PUSH**

Once deployed, any push to `master` branch automatically:
1. Triggers Render webhook
2. Pulls latest code
3. Rebuilds Docker images
4. Redeploys services
5. Zero downtime (rolling restart)

No manual redeployment needed after Stripe setup!

---

## **BEFORE YOU DEPLOY**

Checklist:
- ✅ render.yaml exists in repo root
- ✅ api/Dockerfile exists
- ✅ web/Dockerfile exists
- ✅ Code committed to GitHub
- ✅ Branch: master
- ✅ All tests passing
- ✅ Dependencies verified

---

## **AFTER DEPLOYMENT (IN ORDER)**

1. **Wait 5-10 minutes** for deployment to finish
2. **Copy API URL** from Render dashboard
3. **Copy Web URL** from Render dashboard
4. **Create Stripe webhook** with API URL
5. **Copy webhook secret** from Stripe
6. **Add Stripe keys** to Render environment
7. **Wait 2 minutes** for services to redeploy
8. **Test API health** endpoint
9. **Test Web** dashboard loads
10. **Test Stripe webhook** sends events
11. **Test payment** with test card

---

## **YOUR REPOSITORY IS READY**

```
✅ render.yaml - Deployment blueprint
✅ api/Dockerfile - API container definition
✅ web/Dockerfile - Web container definition
✅ All code committed to GitHub
✅ Master branch up to date
✅ All dependencies installed
✅ Zero vulnerabilities
```

**Everything Render needs is in your repository.**

---

## **NEXT ACTION**

👉 **Go to https://render.com and click "New +" → "Blueprint"**

Your app will be live in 30 minutes.

