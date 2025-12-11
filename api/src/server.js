require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const compression = require("compression");
const { RateLimiterMemory } = require("rate-limiter-flexible");
const { initializeSentry } = require("./services/sentry");
const cacheService = require("./services/cache");
const metricsService = require("./services/metrics");
const { requestLogger, contextMiddleware } = require("./middleware/requestLogger");
const { cacheMiddleware } = require("./middleware/cache");
const healthRoutes = require("./routes/health");
const aiRoutes = require("./routes/ai.commands");
const aiMaintenanceRoutes = require("./routes/ai.maintenance");
const billingRoutes = require("./routes/billing");
const paymentsRoutes = require("./routes/payments");
const feedbackRoutes = require("./routes/feedback");
const adminRoutes = require("./routes/admin");
const onboardingRoutes = require("./routes/onboarding");
const referralRoutes = require("./routes/referral");
const analyticsRoutes = require("./routes/analytics");

const app = express();

// Initialize Sentry for error tracking
initializeSentry(app);

// Initialize cache service
cacheService.initialize();

app.set("trust proxy", 1);

const allowedOrigins = (process.env.CORS_ORIGINS || "*")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions =
  allowedOrigins.includes("*") || allowedOrigins.length === 0
    ? {}
    : { origin: allowedOrigins, optionsSuccessStatus: 200 };

const rateLimiter = new RateLimiterMemory({ points: 100, duration: 60 });
const rateLimiterMiddleware = (req, res, next) => {
  metricsService.recordRequest();
  rateLimiter
    .consume(req.ip)
    .then(() => next())
    .catch(() => {
      metricsService.recordError();
      res.status(429).send("Too Many Requests");
    });
};

app.use(helmet());
app.use(cors(corsOptions));
app.use(compression());
app.use(requestLogger);
// Stripe webhook needs raw body for signature verification
app.use(
  "/api/webhooks/stripe",
  express.raw({ type: "application/json" })
);
app.use(express.json());
app.use(morgan("combined"));
app.use(contextMiddleware);
app.use(rateLimiterMiddleware);

app.use("/api", healthRoutes);
app.use("/api", aiRoutes);
app.use("/api", aiMaintenanceRoutes);
app.use("/api", billingRoutes);
app.use("/api", paymentsRoutes);
app.use("/api", feedbackRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/onboarding", onboardingRoutes);
app.use("/api/referral", referralRoutes);
app.use("/api/analytics", analyticsRoutes);

app.post("/internal/ai-sim", (req, res) => {
  const { command, payload, meta } = req.body || {};
  const reply = {
    echoCommand: command,
    message: "Synthetic AI simulation",
    suggestedAction: "This would route or optimize logistics",
    payload,
    meta,
  };
  res.json(reply);
});

const port = process.env.PORT || 4000;

if (require.main === module) {
  app.listen(port, '0.0.0.0', () => {
    console.log(`Infæmous Freight API listening on port ${port}`);
  });
}

module.exports = app;
