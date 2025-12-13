# 🧪 Complete Testing Guide

## Overview

This guide covers testing all core features: authentication, payments, analytics, onboarding, and referrals.

---

## 1. Local Testing Setup

### 1.1 Prerequisites
```bash
# Copy env template for the web app (edit as needed)
cp web/.env.local.example web/.env.local

# Key vars for local dev
# API_BASE_URL=http://localhost:4000/api
# AI_SYNTHETIC_API_KEY=<matches API>
# NEXT_PUBLIC_API_KEY=<optional demo key>
```

### 1.2 Smoke check the Next proxy (requires `next dev` running)
```bash
cd web
npm run dev &
SMOKE_BASE=http://localhost:3000 npm run smoke:proxy
```

Tip: After obtaining a JWT, you can set it in the browser console so all widget calls authorize:
```js
window.setAuthToken('<jwt_here>')
```

### 1.3 Proxy integration test (expects API running)
```bash
cd web
SMOKE_BASE=http://localhost:3000 npm run test:proxy
```

### 1.3 Services
```bash
# Ensure containers are running
docker compose up -d

# Verify services
curl http://localhost:4000/api/health
curl http://localhost:3000
```

### 1.4 Test Users
Create test users in PostgreSQL:
```sql
-- Connect to container
docker compose exec postgres psql -U infamous -d infamous_freight

-- Create test user
INSERT INTO "User" (email, name, role, "createdAt")
VALUES ('test@example.com', 'Test User', 'customer', NOW());
```

---

## 2. Authentication Testing

### 2.1 Register & Login (Web)
1. Open http://localhost:3000
2. Click "Sign Up"
3. Enter email/password
4. Confirm email (check API logs)
5. Login with credentials

### 2.2 JWT Token (API)
```bash
# Get token
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com", "password":"password123"}'

# Use token in subsequent requests
curl http://localhost:4000/api/analytics/dashboard \
  -H "Authorization: Bearer <token>"
```

---

## 3. Payment Flow Testing

### 3.1 Create Payment Intent
```bash
curl -X POST http://localhost:4000/api/payments/intent \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 14900,
    "currency": "usd",
    "metadata": {"tier": "starter"}
  }'
```

Response:
```json
{
  "id": "pi_...",
  "client_secret": "pi_..._secret_...",
  "status": "requires_payment_method"
}
```

### 3.2 Test Card Payments (Local)
1. Open http://localhost:3000/pricing
2. Click "Buy Starter"
3. Use **test card**: `4242 4242 4242 4242`
4. Expiry: Any future date (e.g., `12/26`)
5. CVC: Any 3 digits (e.g., `123`)
6. Name: Any name

### 3.3 Webhook Testing
```bash
# Start Stripe CLI forwarding
stripe listen --forward-to localhost:4000/webhooks/stripe

# In another terminal, trigger test event
stripe trigger payment_intent.succeeded

# Check API logs for webhook receipt
```

### 3.4 Verify Payment in Database
```bash
docker compose exec postgres psql -U infamous -d infamous_freight

SELECT id, amount, status, "createdAt" FROM "Payment" ORDER BY "createdAt" DESC LIMIT 5;
```

---

## 4. Analytics Dashboard Testing

### 4.1 View Analytics
1. Open http://localhost:3000/dashboard
2. Verify all metrics display:
   - Total Users
   - New Users (30d)
   - Estimated Revenue
   - Shipments
   - Feature Adoption
   - Last Updated timestamp

### 4.2 Generate Test Data
```bash
# Create mock shipments
curl -X POST http://localhost:4000/api/shipments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "origin": "Chicago, IL",
    "destination": "Los Angeles, CA",
    "weight": 1500,
    "value": 5000
  }'
```

### 4.3 Check Metrics Endpoint
```bash
curl http://localhost:4000/api/metrics
```

Should return metrics like:
```json
{
  "uptime": 3600,
  "users": {"total": 5, "drivers": 2, "customers": 3},
  "payments": {"completed": 2, "volume": 29800, "revenue": 29800},
  "health": {"status": "healthy", "requestsPerSecond": "0.05"}
}
```

---

## 5. Onboarding Flow Testing

### 5.1 New User Onboarding
1. Sign up with new email
2. Open http://localhost:3000/onboarding
3. Follow guided steps:
   - Profile setup
   - Company info
   - Integration (API keys, webhooks)
   - Feature tour
4. Verify progress bar updates
5. Check "Completed Steps" section

### 5.2 Onboarding Status API
```bash
curl http://localhost:4000/api/onboarding/status \
  -H "Authorization: Bearer <token>"
```

Response:
```json
{
  "status": "in_progress",
  "progress": 50,
  "completedSteps": ["profile_setup", "company_info"],
  "allSteps": ["profile_setup", "company_info", "integration", "feature_tour"]
}
```

---

## 6. Referral Program Testing

### 6.1 Get Referral Link
```bash
curl http://localhost:4000/api/referral/stats \
  -H "Authorization: Bearer <token>"
```

Response:
```json
{
  "shareUrl": "https://infamous-freight.com?ref=user123abc",
  "conversions": 5,
  "rewards": {"total": 15, "list": [...]},
  "tier": "Silver"
}
```

### 6.2 Test Referral Page
1. Open http://localhost:3000/referral
2. Copy referral link
3. Share link
4. Verify share buttons (Twitter, LinkedIn, Email)

### 6.3 Simulate Referral
```bash
# User clicks ref link and signs up
# API should track and credit referrer
curl -X POST http://localhost:4000/api/referral/track \
  -H "Content-Type: application/json" \
  -d '{"referrerUserId": "user123", "newUserId": "user456"}'
```

---

## 7. Admin Functions Testing

### 7.1 Access Admin Dashboard
```bash
curl http://localhost:4000/api/admin/users \
  -H "Authorization: Bearer <admin_token>"
```

Requires user with `role: 'admin'`

### 7.2 Create Admin User
```bash
-- In PostgreSQL
UPDATE "User" SET role = 'admin' WHERE email = 'admin@example.com';
```

### 7.3 Admin Actions
- View all users
- View all payments
- View system metrics
- Manage feature flags

---

## 8. Email & Notifications Testing

### 8.1 SendGrid Integration
1. Get SendGrid API key from https://sendgrid.com
2. Add to `.env`: `SENDGRID_API_KEY=SG.xxx`
3. Trigger email-sending endpoint:
   ```bash
   curl -X POST http://localhost:4000/api/email/welcome \
     -H "Content-Type: application/json" \
     -d '{"email": "test@example.com", "name": "Test User"}'
   ```

### 8.2 Verify Email Delivery
- Check SendGrid dashboard → Mail Activity
- Verify email appears in inbox (may be in spam)

---

## 9. Rate Limiting Testing

### 9.1 Trigger Rate Limit
```bash
# Make 100+ requests in quick succession
for i in {1..150}; do
  curl http://localhost:4000/api/health
done
```

You should see 429 (Too Many Requests) after limit exceeded.

### 9.2 Configure Limits
Edit `api/src/middleware/rateLimit.js`:
```javascript
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many requests'
});
```

---

## 10. Production Testing (On Staging/Render)

### 10.1 Smoke Tests
```bash
# Health check
curl https://infamous-freight-api.onrender.com/api/health

# Dashboard
curl https://infamous-freight-web.onrender.com/dashboard

# Metrics
curl https://infamous-freight-api.onrender.com/api/metrics
```

### 10.2 Payment Testing (Staging)
1. Get **test Stripe keys** from Stripe Dashboard
2. Add to Render environment
3. Use test card: `4242 4242 4242 4242`
4. Verify webhook delivery in Stripe Dashboard

### 10.3 Live Payment Testing (Production)
1. Get **live Stripe keys** (with `sk_live_`)
2. Add to Render environment
3. Use real credit card
4. Verify transaction in Stripe Dashboard & database

---

## 11. Automated Testing (Jest)

### 11.1 Run API Tests
```bash
cd api
npm test
```

### 11.2 Run Web Tests
```bash
cd web
npm test
```

### 11.3 Coverage Report
```bash
cd api
npm test -- --coverage
open coverage/lcov-report/index.html
```

---

## 12. Load Testing (Optional)

### 12.1 Install K6
```bash
brew install k6
```

### 12.2 Create Load Test
```javascript
// load-test.js
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  vus: 10,
  duration: '30s',
};

export default function() {
  let res = http.get('http://localhost:4000/api/health');
  check(res, {
    'status is 200': (r) => r.status === 200,
  });
}
```

### 12.3 Run Load Test
```bash
k6 run load-test.js
```

---

## Checklist

- [ ] Auth (signup, login, JWT)
- [ ] Payments (create intent, process card, webhook)
- [ ] Analytics (dashboard loads, metrics accurate)
- [ ] Onboarding (flow completes, progress tracked)
- [ ] Referrals (link works, rewards calculated)
- [ ] Email (SendGrid sends notifications)
- [ ] Rate limiting (429 after threshold)
- [ ] Admin (can view all users/payments)
- [ ] Production health checks (HTTP 200)
- [ ] Load test (handles 10+ concurrent users)

---

## Debugging Tips

1. **Check logs**:
   ```bash
   docker compose logs -f api
   docker compose logs -f web
   ```

2. **Database inspection**:
   ```bash
   docker compose exec postgres psql -U infamous -d infamous_freight
   ```

3. **Network requests**:
   - Open browser DevTools → Network tab
   - Monitor requests to `/api/*` endpoints

4. **Stripe webhook debug**:
   ```bash
   stripe logs tail
   ```

5. **Test email delivery**:
   - Use https://mailtrap.io for development
   - Replace SMTP config in `.env`
