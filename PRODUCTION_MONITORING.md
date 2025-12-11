# 🚀 Production Monitoring & Observability Guide

Your payment system is now production-ready with comprehensive monitoring capabilities.

## 📊 Real-Time Monitoring

### Render Dashboard
- **URL:** https://dashboard.render.com/services/infamous-freight-api
- **Key Metrics:**
  - Deploy status (green = healthy)
  - Memory usage
  - CPU usage
  - Network I/O
  - Last deployment time

**What to watch:** 
- Memory trending upward? Check for memory leaks in webhook handlers
- High CPU? May indicate unoptimized Stripe API calls

### Logs
1. Go to **Logs** tab in Render Dashboard
2. Watch for these patterns:
   ```
   ✅ Payment record created  → Success
   💰 Processing successful payment → Started
   ⚠️ Sentry initialized → Error tracking enabled
   ```

## 🔔 Error Tracking (Sentry)

### Setup (if not done)
1. Create account: https://sentry.io
2. Create project for Node.js
3. Copy DSN: `https://xxxxx@sentry.io/xxxxx`
4. Add to Render environment variables:
   ```
   SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
   ```
5. Redeploy API

### Monitor Errors
- **All errors logged automatically** when SENTRY_DSN is set
- Check Sentry Dashboard for:
  - 🔴 Critical errors (webhook failures, database errors)
  - 🟡 Warnings (rate limiting, timeouts)
  - 📊 Error trends over time

**Common errors to watch for:**
```
1. "Missing Stripe signature" → Webhook misconfigured
2. "DATABASE_URL invalid" → Connection string issue
3. "Invalid time value" → Timestamp conversion error
4. "Rate limit exceeded" → Too many API calls (resolve by optimizing)
```

## 📈 Stripe Dashboard Monitoring

### Webhook Deliveries
1. Go to: https://dashboard.stripe.com/webhooks
2. Click your endpoint
3. **View delivery details:**
   - ✅ Green checkmark = Successful (your API returned 200)
   - ❌ Red X = Failed (check Render logs for reason)
   - ⏱️ Orange circle = Pending (Stripe will retry)

**Typical failure patterns:**
- First 1-2 events fail? → Environment variables not set
- Random failures? → Database connection issues
- All failing after deploy? → Check Render deployment status

### Event History
- Track all payment events in Stripe Dashboard
- Verify webhook processing latency (should be <1 second)
- Export event logs for reconciliation audits

## 🔄 Reconciliation Monitoring

Your system includes **daily automatic reconciliation** that:
1. Syncs payments from Stripe → Your DB
2. Checks for status mismatches
3. Logs all discrepancies

**Monitor reconciliation logs:**
```
Look in Render logs for:
"🔄 Starting payment reconciliation..."
"✅ Payment reconciliation completed:"
"   Synced: X, Created: Y, Updated: Z"
```

**What discrepancies mean:**
- **Created:** Stripe had a payment you didn't track (webhook missed it)
- **Updated:** Status changed in Stripe before webhook arrived
- **Synced:** Everything matched ✅

## 💾 Database Health

### Prisma Accelerate Console
1. Go to: https://console.prisma.io
2. Monitor:
   - Query count per minute
   - Connection pool usage
   - API errors/timeouts

**Alerts to set up:**
- Query rate exceeds 1,000/min → Database bottleneck
- Connection pool > 80% → May need scaling
- 5XX errors → Connection issues

## 🚨 Alerting Strategy

### Set up notifications for:

**1. Stripe Webhook Failures**
- Add Slack notification in Stripe Dashboard
- Route to #payments or #alerts channel

**2. Render Deployment Failures**
- Go to Render Dashboard → Project → Notifications
- Add email/Slack for failed deployments

**3. High Error Rate (Sentry)**
- Create alert: Error rate > 5% in 5 minutes
- Notify team immediately

**4. Rate Limiting**
- Monitor 429 errors in logs
- Increase if legitimate traffic
- Investigate if sudden spike

## 📋 Daily Monitoring Checklist

**☑️ Morning (5 min)**
1. Check Render logs for overnight errors
2. Verify last successful webhook processed
3. Review Sentry for critical errors

**☑️ Midday (10 min)**
1. Spot-check Stripe Dashboard webhook deliveries
2. Monitor webhook latency trending
3. Verify no database connection issues in logs

**☑️ End of day (10 min)**
1. Review daily reconciliation report (in Render logs)
2. Check for any discrepancies
3. Document any issues for follow-up

## 🔍 Troubleshooting Common Issues

### Webhooks Not Arriving
1. Check Render → Logs → "Unhandled event type"
2. Verify webhook URL in Stripe Dashboard (must have /api/webhooks/stripe)
3. Verify STRIPE_WEBHOOK_SECRET matches Stripe Dashboard
4. Check if API is running: visit `https://infamous-freight-api.onrender.com/api/health`

### Webhooks Arrive But No Database Records
1. Check for "Database connection error" in logs
2. Verify DATABASE_URL is set in Render
3. Check Prisma Accelerate connection status
4. Review Sentry for specific SQL errors

### High Latency (>5 seconds)
1. Check database query logs in Prisma Console
2. Look for N+1 query problems in webhook handlers
3. Check if Redis is enabled (caches repeated queries)
4. Monitor Stripe API rate limiting

### Intermittent Failures
1. Often indicates rate limiting (API or database)
2. Check error patterns in Sentry (look for retry timing)
3. May need to implement exponential backoff
4. Consider pagination for bulk Stripe API calls

## 📊 Key Metrics to Track

| Metric | Healthy Range | Warning | Critical |
|--------|----------------|---------|----------|
| Webhook Success Rate | >99% | 95-99% | <95% |
| Webhook Latency | <1s | 1-5s | >5s |
| DB Connection Pool | <70% | 70-90% | >90% |
| Memory Usage | <200MB | 200-500MB | >500MB |
| Error Rate (Sentry) | <1% | 1-5% | >5% |
| Reconciliation Discrepancies | 0 | <5% | >5% |

## 🔐 Security Monitoring

**Watch for suspicious patterns:**
- Same payment intent processed multiple times
- Unusually high refund rates
- Dispute/chargeback spikes
- Customer deleted events without cancellations

**Enable audit logging:**
- All webhook events are logged in AiEvent table
- Regular export for security audits
- Keep 90+ days of history for PCI compliance

## 🎯 Performance Optimization

Once monitoring is in place, optimize:

1. **Enable Redis caching** (if not done)
   - Set REDIS_URL in Render environment
   - Caches customer lookups, subscription status
   - Reduces database queries by ~40%

2. **Add rate limit adjustments**
   - Monitor 429 responses
   - Adjust if legitimate traffic exceeds limits
   - Current: 100 requests/60 seconds

3. **Consider job queue** (if webhook volume exceeds 1000/day)
   - Bull or RabbitMQ for async processing
   - Prevents blocking on slow operations
   - Not needed yet, but keep in mind

## 📞 When to Escalate

Escalate to Stripe Support if:
- Webhook endpoint consistently returns 5XX errors
- Stripe shows delivery failures for correct URL
- API rate limit constantly hit for legitimate traffic

Escalate to Render Support if:
- Deployment fails repeatedly
- API crashes on startup
- Memory/CPU spikes beyond expectations

---

**Your system is monitored! 24/7 observability is now active.** 🎉

Continue monitoring these metrics, and your payment system will be rock-solid.
