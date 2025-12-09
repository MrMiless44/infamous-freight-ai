# API Documentation

## Base URL
- **Development**: `http://localhost:4000/api`
- **Production**: `https://api.infamous-freight.com/api`

## Authentication
All protected endpoints require a JWT token in the `Authorization` header:
```
Authorization: Bearer <jwt_token>
```

---

## Endpoints

### Health & Status

#### GET /health
Public health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

#### GET /health/full
Detailed health status (auth required for full details).

**Response:**
```json
{
  "timestamp": "2025-01-01T00:00:00.000Z",
  "uptime": 3600,
  "memory": { "heapUsed": 12345, "heapTotal": 65536 },
  "database": "connected",
  "cache": "connected"
}
```

---

### Admin Endpoints (Admin Only)

#### GET /admin/metrics
Real-time application metrics.

**Response:**
```json
{
  "timestamp": "2025-01-01T00:00:00.000Z",
  "uptime": 3600,
  "server": {
    "requests": 1234,
    "errors": 5,
    "errorRate": "0.41%"
  },
  "users": {
    "total": 42,
    "drivers": 15,
    "customers": 27
  },
  "payments": {
    "completed": 89,
    "volume": 15000,
    "revenue": 15000,
    "averageTransaction": "168.54"
  },
  "health": {
    "status": "healthy",
    "requestsPerSecond": "0.34"
  }
}
```

#### POST /admin/metrics/reset
Reset metrics counters.

**Response:**
```json
{
  "message": "Metrics reset",
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

---

### Payments

#### POST /payments/create-checkout-session
Create a Stripe checkout session for payment.

**Body:**
```json
{
  "amount": 2999,
  "shipmentId": "uuid",
  "driverId": "uuid"
}
```

**Response:**
```json
{
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/..."
}
```

#### POST /payments/webhook/stripe
Stripe webhook for payment updates. Automatically triggered by Stripe.

---

### Feedback

#### POST /feedback
Submit user feedback.

**Body:**
```json
{
  "feedback": "Great service!",
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Thank you for your feedback!",
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

---

### Billing

#### GET /billing/usage
Get current billing usage (auth required).

#### POST /billing/upgrade
Upgrade billing tier (auth required).

---

### AI Commands

#### POST /ai/commands
Send AI command for logistics optimization.

**Body:**
```json
{
  "command": "optimize_route",
  "shipmentIds": ["uuid1", "uuid2"]
}
```

---

## Response Headers

All responses include:
- `X-Request-ID`: Unique request identifier for tracing
- `X-Cache-Hit`: Whether response was cached (true/false)

## Rate Limiting

- **Global**: 100 requests per minute per IP
- **Payments**: 30 requests per minute per IP
- **Status Code**: 429 (Too Many Requests)

## Error Handling

### Error Response Format
```json
{
  "error": "Error message",
  "requestId": "req_1234567890_abc123"
}
```

### Common Status Codes
- **200**: Success
- **400**: Bad Request
- **401**: Unauthorized
- **403**: Forbidden
- **404**: Not Found
- **429**: Too Many Requests
- **500**: Internal Server Error

## Environment Variables

### Required
- `NODE_ENV`: Environment (development/production)
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret for JWT signing
- `STRIPE_SECRET_KEY`: Stripe API secret key

### Optional
- `SENTRY_DSN`: Error tracking URL
- `REDIS_URL`: Redis cache URL (caching disabled if not set)
- `STRIPE_WEBHOOK_SECRET`: Stripe webhook secret

## Performance

### Caching
- Health checks: 5 minute cache
- User data: 1 hour cache
- Metrics: No cache (real-time)

### Compression
- All responses compressed with gzip
- Typical compression ratio: 60-70%

---

## Monitoring

### Metrics Available
- Request count and rate
- Error count and rate
- Payment processing metrics
- Database performance
- Cache hit rate
- Memory usage
- Uptime

### Request Tracing
All requests include `X-Request-ID` header for distributed tracing:
```
X-Request-ID: req_1234567890_abc123
```

Use this ID to correlate logs across services.

---

## Testing

### Health Check
```bash
curl http://localhost:4000/api/health
```

### Admin Metrics (requires auth)
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:4000/api/admin/metrics
```

### Submit Feedback
```bash
curl -X POST http://localhost:4000/api/feedback \
  -H "Content-Type: application/json" \
  -d '{"feedback": "Test", "email": "test@example.com"}'
```

---

## Version
API Version: 1.0.0  
Last Updated: 2025-01-01
