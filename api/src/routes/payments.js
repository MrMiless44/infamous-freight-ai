const express = require("express");
const authHybrid = require("../middleware/auth.hybrid");
const scopeGuard = require("../middleware/scopeGuard");
const rateLimit = require("../middleware/rateLimit");
const audit = require("../middleware/audit");
const {
  createStripeIntent,
  createPayPalOrder,
  capturePayPalOrder,
  buildStripeWebhook,
} = require("../services/payments");
const {
  handlePaymentIntentSucceeded,
  handlePaymentIntentFailed,
  handleSubscriptionCreated,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted,
  handleInvoicePaymentSucceeded,
  handleInvoicePaymentFailed,
  handleCheckoutSessionCompleted,
} = require("../services/stripe-webhook-handlers");

const router = express.Router();
const PAYMENT_SCOPES = ["billing:write", "billing:read"];

router.post(
  "/payments/intent",
  authHybrid,
  scopeGuard(PAYMENT_SCOPES),
  rateLimit({ points: 30, duration: 60 }),
  audit,
  async (req, res) => {
    const { amount, currency, metadata } = req.body || {};
    if (!amount) {
      return res.status(400).json({ error: "amount is required in cents" });
    }

    try {
      const intent = await createStripeIntent({ amount, currency, metadata });
      res.json({
        ok: true,
        intentId: intent.id,
        clientSecret: intent.client_secret,
      });
    } catch (err) {
      if (err.message === "STRIPE_NOT_CONFIGURED") {
        return res.status(501).json({ error: "Stripe is not configured yet" });
      }
      console.error("Stripe intent error", err);
      res.status(502).json({ error: "Unable to create payment intent" });
    }
  }
);

router.post(
  "/payments/paypal/order",
  authHybrid,
  scopeGuard(PAYMENT_SCOPES),
  rateLimit({ points: 30, duration: 60 }),
  audit,
  async (req, res) => {
    const { amount, currency, referenceId } = req.body || {};
    if (!amount) {
      return res.status(400).json({ error: "amount is required" });
    }

    try {
      const order = await createPayPalOrder({ amount, currency, referenceId });
      res.json({ ok: true, order });
    } catch (err) {
      if (err.message === "PAYPAL_NOT_CONFIGURED") {
        return res.status(501).json({ error: "PayPal is not configured yet" });
      }
      console.error("PayPal order error", err);
      res.status(502).json({ error: "Unable to create PayPal order" });
    }
  }
);

router.post(
  "/payments/paypal/:orderId/capture",
  authHybrid,
  scopeGuard(PAYMENT_SCOPES),
  audit,
  async (req, res) => {
    try {
      const capture = await capturePayPalOrder(req.params.orderId);
      res.json({ ok: true, capture });
    } catch (err) {
      if (err.message === "PAYPAL_NOT_CONFIGURED") {
        return res.status(501).json({ error: "PayPal is not configured yet" });
      }
      console.error("PayPal capture error", err);
      res.status(502).json({ error: "Unable to capture PayPal order" });
    }
  }
);

router.post("/webhooks/stripe", async (req, res) => {
  const signature = req.headers["stripe-signature"];
  
  if (!signature) {
    console.error("Missing Stripe signature header");
    return res.status(400).json({ error: "Missing signature" });
  }

  try {
    const event = buildStripeWebhook(req.body, signature);
    
    if (event.type === "invalid") {
      console.error("Invalid Stripe webhook signature:", event.error);
      return res.status(400).json({ error: "Invalid signature" });
    }

    // Handle the event with dedicated handlers
    let result;
    switch (event.type) {
      case "payment_intent.succeeded":
        result = await handlePaymentIntentSucceeded(event.data.object);
        break;

      case "payment_intent.payment_failed":
        result = await handlePaymentIntentFailed(event.data.object);
        break;

      case "customer.subscription.created":
        result = await handleSubscriptionCreated(event.data.object);
        break;

      case "customer.subscription.updated":
        result = await handleSubscriptionUpdated(event.data.object);
        break;

      case "customer.subscription.deleted":
        result = await handleSubscriptionDeleted(event.data.object);
        break;

      case "invoice.payment_succeeded":
        result = await handleInvoicePaymentSucceeded(event.data.object);
        break;

      case "invoice.payment_failed":
        result = await handleInvoicePaymentFailed(event.data.object);
        break;

      case "checkout.session.completed":
        result = await handleCheckoutSessionCompleted(event.data.object);
        break;

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
        result = { success: true, message: "Event type not handled" };
    }

    // Return a 200 response to acknowledge receipt of the event
    res.json({ received: true, result });
  } catch (err) {
    console.error("Stripe webhook error:", err);
    // Still return 200 to prevent retries for non-critical errors
    res.status(200).json({ received: true, error: err.message });
  }
});

router.post("/payments/webhook/paypal", audit, (req, res) => {
  console.log("PayPal webhook payload", JSON.stringify(req.body));
  res.json({ ok: true });
});

module.exports = router;
