/**
 * Payment Reconciliation Service
 * Syncs payment data between Stripe and local database
 * Run daily to ensure data consistency
 */

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const prisma = require("../lib/prisma");

/**
 * Reconcile payments: check for discrepancies between Stripe and DB
 */
async function reconcilePayments() {
  console.log("🔄 Starting payment reconciliation...");
  
  try {
    const startTime = Date.now();
    const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Last 30 days

    // Get payments from Stripe
    const stripePayments = [];
    let hasMore = true;
    let startingAfter = null;

    while (hasMore) {
      const result = await stripe.paymentIntents.list({
        limit: 100,
        starting_after: startingAfter,
        created: { gte: Math.floor(cutoffDate.getTime() / 1000) },
      });

      stripePayments.push(...result.data);
      hasMore = result.has_more;
      startingAfter = result.data[result.data.length - 1]?.id;
    }

    console.log(`📊 Found ${stripePayments.length} payments in Stripe`);

    // Compare with database
    let synced = 0;
    let created = 0;
    let updated = 0;
    let discrepancies = [];

    for (const stripePayment of stripePayments) {
      const dbPayment = await prisma.payment.findUnique({
        where: { stripePaymentIntentId: stripePayment.id },
      });

      if (!dbPayment) {
        // Missing from DB - create it
        await prisma.payment.create({
          data: {
            stripePaymentIntentId: stripePayment.id,
            userId: stripePayment.metadata?.userId || null,
            amount: stripePayment.amount,
            currency: stripePayment.currency,
            status: stripePayment.status,
            metadata: stripePayment.metadata || {},
          },
        });
        created++;
      } else if (dbPayment.status !== stripePayment.status) {
        // Status mismatch - update
        await prisma.payment.update({
          where: { id: dbPayment.id },
          data: { status: stripePayment.status },
        });
        updated++;
        discrepancies.push({
          paymentId: stripePayment.id,
          dbStatus: dbPayment.status,
          stripeStatus: stripePayment.status,
          type: "status_mismatch",
        });
      } else {
        synced++;
      }
    }

    const duration = (Date.now() - startTime) / 1000;
    
    const report = {
      timestamp: new Date().toISOString(),
      duration: `${duration}s`,
      total: stripePayments.length,
      synced,
      created,
      updated,
      discrepancies,
    };

    // Log reconciliation report
    await prisma.aiEvent.create({
      data: {
        type: "reconciliation.payments.completed",
        payload: report,
      },
    });

    console.log(`✅ Payment reconciliation completed:`);
    console.log(`   Synced: ${synced}, Created: ${created}, Updated: ${updated}`);
    if (discrepancies.length > 0) {
      console.log(`   ⚠️ Discrepancies found: ${discrepancies.length}`);
    }

    return report;
  } catch (error) {
    console.error("❌ Payment reconciliation failed:", error);
    await prisma.aiEvent.create({
      data: {
        type: "reconciliation.payments.failed",
        payload: { error: error.message },
      },
    });
    throw error;
  }
}

/**
 * Reconcile subscriptions with Stripe
 */
async function reconcileSubscriptions() {
  console.log("🔄 Starting subscription reconciliation...");
  
  try {
    const startTime = Date.now();

    // Get subscriptions from Stripe
    const stripeSubscriptions = [];
    let hasMore = true;
    let startingAfter = null;

    while (hasMore) {
      const result = await stripe.subscriptions.list({
        limit: 100,
        starting_after: startingAfter,
        status: "all",
      });

      stripeSubscriptions.push(...result.data);
      hasMore = result.has_more;
      startingAfter = result.data[result.data.length - 1]?.id;
    }

    console.log(`📊 Found ${stripeSubscriptions.length} subscriptions in Stripe`);

    let synced = 0;
    let created = 0;
    let updated = 0;
    let discrepancies = [];

    for (const stripeSub of stripeSubscriptions) {
      const dbSub = await prisma.subscription.findUnique({
        where: { stripeSubscriptionId: stripeSub.id },
      });

      if (!dbSub) {
        // Missing from DB - create it
        await prisma.subscription.create({
          data: {
            stripeSubscriptionId: stripeSub.id,
            stripeCustomerId: stripeSub.customer,
            userId: stripeSub.metadata?.userId || null,
            status: stripeSub.status,
            priceId: stripeSub.items?.data[0]?.price?.id || null,
            currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
            currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
            cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
            metadata: stripeSub.metadata || {},
          },
        });
        created++;
      } else if (dbSub.status !== stripeSub.status) {
        // Status mismatch - update
        await prisma.subscription.update({
          where: { id: dbSub.id },
          data: { 
            status: stripeSub.status,
            cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
          },
        });
        updated++;
        discrepancies.push({
          subscriptionId: stripeSub.id,
          dbStatus: dbSub.status,
          stripeStatus: stripeSub.status,
          type: "status_mismatch",
        });
      } else {
        synced++;
      }
    }

    const duration = (Date.now() - startTime) / 1000;

    const report = {
      timestamp: new Date().toISOString(),
      duration: `${duration}s`,
      total: stripeSubscriptions.length,
      synced,
      created,
      updated,
      discrepancies,
    };

    await prisma.aiEvent.create({
      data: {
        type: "reconciliation.subscriptions.completed",
        payload: report,
      },
    });

    console.log(`✅ Subscription reconciliation completed:`);
    console.log(`   Synced: ${synced}, Created: ${created}, Updated: ${updated}`);
    if (discrepancies.length > 0) {
      console.log(`   ⚠️ Discrepancies found: ${discrepancies.length}`);
    }

    return report;
  } catch (error) {
    console.error("❌ Subscription reconciliation failed:", error);
    await prisma.aiEvent.create({
      data: {
        type: "reconciliation.subscriptions.failed",
        payload: { error: error.message },
      },
    });
    throw error;
  }
}

/**
 * Verify webhook event delivery health
 */
async function checkWebhookHealth() {
  console.log("🔍 Checking webhook health...");
  
  try {
    // Check for events in the last 24 hours
    const past24h = Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000);
    
    const recentEvents = await prisma.aiEvent.findMany({
      where: {
        type: {
          in: [
            "payment_intent.succeeded",
            "customer.subscription.created",
            "invoice.payment_succeeded",
          ],
        },
        createdAt: {
          gte: new Date(past24h * 1000),
        },
      },
    });

    const eventTypes = {};
    recentEvents.forEach(event => {
      eventTypes[event.type] = (eventTypes[event.type] || 0) + 1;
    });

    const health = {
      timestamp: new Date().toISOString(),
      lastWebhooks: recentEvents.length,
      byType: eventTypes,
      status: recentEvents.length > 0 ? "healthy" : "warning",
    };

    console.log(`✅ Webhook health check: ${health.status}`);
    console.log(`   Events (24h): ${health.lastWebhooks}`);

    return health;
  } catch (error) {
    console.error("❌ Webhook health check failed:", error);
    throw error;
  }
}

/**
 * Run full reconciliation daily
 */
async function runDailyReconciliation() {
  console.log("\n📅 Running daily reconciliation suite...\n");
  
  try {
    const startTime = Date.now();

    const paymentReport = await reconcilePayments();
    const subscriptionReport = await reconcileSubscriptions();
    const webhookHealth = await checkWebhookHealth();

    const totalDuration = (Date.now() - startTime) / 1000;

    const summary = {
      timestamp: new Date().toISOString(),
      duration: `${totalDuration}s`,
      payments: paymentReport,
      subscriptions: subscriptionReport,
      webhookHealth,
      status: "completed",
    };

    await prisma.aiEvent.create({
      data: {
        type: "reconciliation.daily.completed",
        payload: summary,
      },
    });

    console.log(`\n✅ Daily reconciliation completed in ${totalDuration}s\n`);
    return summary;
  } catch (error) {
    console.error("\n❌ Daily reconciliation failed:", error);
    await prisma.aiEvent.create({
      data: {
        type: "reconciliation.daily.failed",
        payload: { error: error.message },
      },
    });
    throw error;
  }
}

module.exports = {
  reconcilePayments,
  reconcileSubscriptions,
  checkWebhookHealth,
  runDailyReconciliation,
};
