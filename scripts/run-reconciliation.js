#!/usr/bin/env node

/**
 * Daily Reconciliation Scheduler
 * Run this as a cron job or scheduled task to sync Stripe data daily
 *
 * Example cron setup (daily at 2 AM UTC):
 * 0 2 * * * /usr/bin/node /app/scripts/run-reconciliation.js
 *
 * Or in Render:
 * Create a separate service with:
 * Command: node /app/scripts/run-reconciliation.js
 * Schedule: 0 2 * * * (daily at 2 AM)
 */

require("dotenv").config();

const { runDailyReconciliation } = require("../src/services/reconciliation");

async function main() {
  console.log("📅 Scheduled reconciliation starting...");
  console.log(`Time: ${new Date().toISOString()}`);
  console.log("");

  try {
    const result = await runDailyReconciliation();
    console.log("");
    console.log("Report Summary:");
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Reconciliation failed with error:");
    console.error(error);
    process.exit(1);
  }
}

// Run the main function
main();
