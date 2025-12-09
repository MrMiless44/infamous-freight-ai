# 🐳 Local Docker Compose Testing Guide

## Quick Start

### 1. Prepare Environment File

```bash
# Copy the Docker template to .env
cp .env.docker .env

# Edit .env and add your Stripe TEST keys (not live keys!)
nano .env
# OR
vim .env
```

**Required Stripe Test Keys:**
- Get from: https://dashboard.stripe.com/test/apikeys
- Use `sk_test_*` (Secret Key)
- Use `pk_test_*` (Publishable Key)
- For webhook secret, after starting Docker:
  1. In Stripe Dashboard → Developers → Webhooks
  2. Create endpoint: `http://localhost/api/webhooks/stripe`
  3. Copy the signing secret (`whsec_*`)

### 2. Start All Services with Docker Compose

```bash
# Navigate to project root
cd /Users/mrmiless/IFE/infamous-freight-ai

# Start all services (PostgreSQL, API, Web, Nginx)
docker-compose up -d

# Watch the logs
docker-compose logs -f

# Or watch only API logs
docker-compose logs -f api
```

### 3. Verify All Services Are Running

```bash
# Check service status
docker-compose ps

# Expected output:
# NAME              STATUS             PORTS
# infamous_api      running (healthy)  4000/4000
# infamous_web      running (healthy)  3000/3000
# infamous_pg       running            5432/5432
# infamous_nginx    running            80/80
```

### 4. Test Your Local API

```bash
# Health check
curl http://localhost:4000/api/health

# Expected response:
# {"status":"ok","timestamp":"2025-12-09T...","uptime":...}
```

### 5. Access Your Applications

- **Web Dashboard:** http://localhost:3000
- **API Directly:** http://localhost:4000
- **Nginx Proxy:** http://localhost

### 6. Test Stripe Webhooks Locally

```bash
# Send a test webhook event to your local endpoint
curl -X POST http://localhost:4000/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -H "Stripe-Signature: <signature>" \
  -d '{"type":"payment_intent.succeeded","data":{"object":{"id":"pi_test","amount":10000}}}'
```

**Better way:** Use Stripe CLI to forward webhooks:

```bash
# Install Stripe CLI (if not installed)
brew install stripe/stripe-cli/stripe

# Forward Stripe events to your local webhook endpoint
stripe listen --forward-to localhost:4000/api/webhooks/stripe

# In another terminal, trigger a test event
stripe trigger payment_intent.succeeded
```

### 7. View Database

```bash
# Connect to PostgreSQL inside Docker
docker-compose exec postgres psql -U infamous -d infamous_freight

# Common commands:
\dt                    # List all tables
SELECT * FROM "User";  # Query users
SELECT * FROM "Driver"; # Query drivers
\q                     # Quit
```

### 8. Tail Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api
docker-compose logs -f postgres
docker-compose logs -f web
```

### 9. Stop All Services

```bash
# Stop but keep containers/volumes
docker-compose stop

# Stop and remove containers (keep volumes)
docker-compose down

# Stop and remove everything (including data!)
docker-compose down -v
```

---

## Troubleshooting

### API Service Won't Start

```bash
# Check API logs
docker-compose logs api

# Rebuild the image (if code changed)
docker-compose build api
docker-compose up -d api
```

### Database Connection Error

```bash
# Verify PostgreSQL is running
docker-compose ps postgres

# Check DB credentials in .env
# DATABASE_URL should match: postgresql://infamous:infamouspass@postgres:5432/infamous_freight

# Restart PostgreSQL
docker-compose restart postgres
```

### Port Already in Use

```bash
# Find what's using port 4000 (API)
lsof -i :4000

# Or use Docker to change port in docker-compose.yml:
# Change: "4000:4000"
# To:     "4001:4000"
```

### Stripe Webhook Not Receiving Events

```bash
# 1. Verify API is running
docker-compose logs api | grep webhook

# 2. Ensure Stripe endpoint is configured correctly
# 3. Check Stripe test data mode is active in Dashboard
# 4. Verify STRIPE_WEBHOOK_SECRET matches in .env
```

---

## Next Steps

After testing locally:

1. ✅ Run integration tests: `npm test` in `/api`
2. ✅ Test all payment flows manually
3. ✅ Verify Stripe test mode works
4. ✅ Check email notifications (if implemented)
5. ✅ Push changes to GitHub: `git push`
6. ✅ Deploy to Render.com (uses same docker-compose setup)

---

## Production Deployment Checklist

Before going live to production:

- [ ] Switch Stripe keys to `sk_live_*` (not test keys)
- [ ] Update webhook secret to production secret
- [ ] Enable HTTPS only
- [ ] Set `AI_SECURITY_MODE=strict`
- [ ] Enable audit logging
- [ ] Configure proper rate limiting
- [ ] Set up monitoring and alerts
- [ ] Test all payment flows with real Stripe test mode
- [ ] Verify email delivery
- [ ] Document support process

See `DEPLOYMENT_PRODUCTION.md` for full production checklist.
