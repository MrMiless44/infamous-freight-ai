const prisma = require('../lib/prisma');

/**
 * Stripe Webhook Event Handlers
 * Handles business logic for different Stripe webhook events
 */

/**
 * Handle successful payment intent
 */
async function handlePaymentIntentSucceeded(paymentIntent) {
  const { id, amount, currency, customer, metadata } = paymentIntent;
  
  console.log(`💰 Processing successful payment: ${id}`);
  console.log(`   Amount: ${amount / 100} ${currency.toUpperCase()}`);
  console.log(`   Customer: ${customer}`);
  console.log(`   Metadata:`, metadata);

  try {
    // Create or update payment record
    const payment = await prisma.payment.upsert({
      where: { stripePaymentIntentId: id },
      create: {
        stripePaymentIntentId: id,
        userId: metadata?.userId || null,
        amount,
        currency,
        status: 'succeeded',
        metadata: metadata || {},
      },
      update: {
        status: 'succeeded',
        amount,
        metadata: metadata || {},
      },
    });

    // Log the event
    await prisma.aiEvent.create({
      data: {
        type: 'payment_intent.succeeded',
        payload: {
          paymentIntentId: id,
          paymentId: payment.id,
          amount,
          currency,
          customer,
          metadata,
          timestamp: new Date().toISOString(),
        },
      },
    });

    console.log(`   ✅ Payment record created/updated: ${payment.id}`);

    // TODO: Send confirmation email
    // TODO: Fulfill digital goods/services
    // TODO: Trigger onboarding flow for new customers
    
    return { success: true, paymentIntentId: id, paymentId: payment.id };
  } catch (error) {
    console.error('Error handling payment intent succeeded:', error);
    throw error;
  }
}

/**
 * Handle failed payment intent
 */
async function handlePaymentIntentFailed(paymentIntent) {
  const { id, last_payment_error, customer, metadata } = paymentIntent;
  
  console.log(`❌ Processing failed payment: ${id}`);
  console.log(`   Error: ${last_payment_error?.message || 'Unknown error'}`);

  try {
    await prisma.aiEvent.create({
      data: {
        type: 'payment_intent.payment_failed',
        payload: {
          paymentIntentId: id,
          error: last_payment_error?.message,
          customer,
          metadata,
          timestamp: new Date().toISOString(),
        },
      },
    });

    // TODO: Send payment failure notification email
    // TODO: Log for analytics/retry logic
    
    return { success: true, logged: true };
  } catch (error) {
    console.error('Error handling payment intent failed:', error);
    throw error;
  }
}

/**
 * Handle new subscription created
 */
async function handleSubscriptionCreated(subscription) {
  const { id, customer, status, items, current_period_end, current_period_start, metadata } = subscription;
  
  console.log(`🎉 New subscription created: ${id}`);
  console.log(`   Customer: ${customer}`);
  console.log(`   Status: ${status}`);
  
  // Safely convert timestamps
  const periodStart = current_period_start ? new Date(current_period_start * 1000) : null;
  const periodEnd = current_period_end ? new Date(current_period_end * 1000) : null;
  
  if (periodStart && periodEnd) {
    console.log(`   Period: ${periodStart.toISOString()} - ${periodEnd.toISOString()}`);
  }

  try {
    const priceId = items.data[0]?.price?.id;

    // Create or update subscription record
    const sub = await prisma.subscription.upsert({
      where: { stripeSubscriptionId: id },
      create: {
        stripeSubscriptionId: id,
        stripeCustomerId: customer,
        userId: metadata?.userId || null,
        status,
        priceId,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
        metadata: metadata || {},
      },
      update: {
        status,
        priceId,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        metadata: metadata || {},
      },
    });

    await prisma.aiEvent.create({
      data: {
        type: 'customer.subscription.created',
        payload: {
          subscriptionId: id,
          subscriptionRecordId: sub.id,
          customer,
          status,
          priceId,
          currentPeriodEnd: current_period_end,
          metadata,
          timestamp: new Date().toISOString(),
        },
      },
    });

    console.log(`   ✅ Subscription record created: ${sub.id}`);

    // TODO: Send welcome email with subscription details
    // TODO: Provision subscription access/permissions
    // TODO: Start trial period if applicable

    return { success: true, subscriptionId: id, subscriptionRecordId: sub.id };
  } catch (error) {
    console.error('Error handling subscription created:', error);
    throw error;
  }
}

/**
 * Handle subscription updated
 */
async function handleSubscriptionUpdated(subscription) {
  const { id, customer, status, cancel_at_period_end, current_period_start, current_period_end, canceled_at, metadata } = subscription;
  
  console.log(`📝 Subscription updated: ${id}`);
  console.log(`   Status: ${status}`);
  console.log(`   Cancel at period end: ${cancel_at_period_end}`);

  try {
    // Update subscription record
    const sub = await prisma.subscription.update({
      where: { stripeSubscriptionId: id },
      data: {
        status,
        cancelAtPeriodEnd: cancel_at_period_end,
        currentPeriodStart: current_period_start ? new Date(current_period_start * 1000) : null,
        currentPeriodEnd: current_period_end ? new Date(current_period_end * 1000) : null,
        canceledAt: canceled_at ? new Date(canceled_at * 1000) : null,
        metadata: metadata || {},
      },
    });

    await prisma.aiEvent.create({
      data: {
        type: 'customer.subscription.updated',
        payload: {
          subscriptionId: id,
          subscriptionRecordId: sub.id,
          customer,
          status,
          cancelAtPeriodEnd: cancel_at_period_end,
          metadata,
          timestamp: new Date().toISOString(),
        },
      },
    });

    console.log(`   ✅ Subscription updated: ${sub.id}`);

    // TODO: Send notification if subscription is set to cancel
    // TODO: Adjust user permissions if plan changed

    return { success: true, subscriptionId: id, subscriptionRecordId: sub.id };
  } catch (error) {
    console.error('Error handling subscription updated:', error);
    throw error;
  }
}

/**
 * Handle subscription deleted/cancelled
 */
async function handleSubscriptionDeleted(subscription) {
  const { id, customer, status, metadata } = subscription;
  
  console.log(`🗑️ Subscription cancelled: ${id}`);
  console.log(`   Customer: ${customer}`);

  try {
    // Update subscription status to canceled
    const sub = await prisma.subscription.update({
      where: { stripeSubscriptionId: id },
      data: {
        status: 'canceled',
        canceledAt: new Date(),
      },
    });

    await prisma.aiEvent.create({
      data: {
        type: 'customer.subscription.deleted',
        payload: {
          subscriptionId: id,
          subscriptionRecordId: sub.id,
          customer,
          status,
          metadata,
          timestamp: new Date().toISOString(),
        },
      },
    });

    console.log(`   ✅ Subscription cancelled in database: ${sub.id}`);

    // TODO: Revoke subscription access
    // TODO: Downgrade user to free tier
    // TODO: Send cancellation confirmation email
    // TODO: Trigger exit survey/feedback

    return { success: true, subscriptionId: id, subscriptionRecordId: sub.id };
  } catch (error) {
    console.error('Error handling subscription deleted:', error);
    throw error;
  }
}

/**
 * Handle successful invoice payment
 */
async function handleInvoicePaymentSucceeded(invoice) {
  const { id, customer, subscription, amount_paid, amount_due, currency, metadata } = invoice;
  
  console.log(`💸 Invoice paid: ${id}`);
  console.log(`   Amount: ${amount_paid / 100} ${currency.toUpperCase()}`);
  console.log(`   Subscription: ${subscription}`);

  try {
    // Get subscription record ID if exists
    let subscriptionRecord = null;
    if (subscription) {
      subscriptionRecord = await prisma.subscription.findUnique({
        where: { stripeSubscriptionId: subscription },
        select: { id: true, userId: true },
      });
    }

    // Create or update invoice record
    const inv = await prisma.invoice.upsert({
      where: { stripeInvoiceId: id },
      create: {
        stripeInvoiceId: id,
        userId: subscriptionRecord?.userId || metadata?.userId || null,
        subscriptionId: subscriptionRecord?.id || null,
        amountDue: amount_due,
        amountPaid: amount_paid,
        currency,
        status: 'paid',
        metadata: metadata || {},
      },
      update: {
        amountPaid: amount_paid,
        status: 'paid',
        metadata: metadata || {},
      },
    });

    await prisma.aiEvent.create({
      data: {
        type: 'invoice.payment_succeeded',
        payload: {
          invoiceId: id,
          invoiceRecordId: inv.id,
          customer,
          subscription,
          amountPaid: amount_paid,
          currency,
          metadata,
          timestamp: new Date().toISOString(),
        },
      },
    });

    console.log(`   ✅ Invoice record created/updated: ${inv.id}`);

    // TODO: Send payment receipt email
    // TODO: Trigger analytics event

    return { success: true, invoiceId: id, invoiceRecordId: inv.id };
  } catch (error) {
    console.error('Error handling invoice payment succeeded:', error);
    throw error;
  }
}

/**
 * Handle failed invoice payment
 */
async function handleInvoicePaymentFailed(invoice) {
  const { id, customer, subscription, amount_due, attempt_count, metadata } = invoice;
  
  console.log(`⚠️ Invoice payment failed: ${id}`);
  console.log(`   Attempt: ${attempt_count}`);
  console.log(`   Amount due: ${amount_due / 100}`);

  try {
    // Get subscription record ID if exists
    let subscriptionRecord = null;
    if (subscription) {
      subscriptionRecord = await prisma.subscription.findUnique({
        where: { stripeSubscriptionId: subscription },
        select: { id: true, userId: true },
      });
    }

    // Create or update invoice record
    const inv = await prisma.invoice.upsert({
      where: { stripeInvoiceId: id },
      create: {
        stripeInvoiceId: id,
        userId: subscriptionRecord?.userId || metadata?.userId || null,
        subscriptionId: subscriptionRecord?.id || null,
        amountDue: amount_due,
        amountPaid: 0,
        currency: 'usd',
        status: 'failed',
        attemptCount: attempt_count,
        metadata: metadata || {},
      },
      update: {
        status: 'failed',
        attemptCount: attempt_count,
        metadata: metadata || {},
      },
    });

    await prisma.aiEvent.create({
      data: {
        type: 'invoice.payment_failed',
        payload: {
          invoiceId: id,
          invoiceRecordId: inv.id,
          customer,
          subscription,
          amountDue: amount_due,
          attemptCount: attempt_count,
          metadata,
          timestamp: new Date().toISOString(),
        },
      },
    });

    console.log(`   ✅ Invoice failure recorded: ${inv.id}`);

    // TODO: Send dunning email (payment retry notification)
    // TODO: If final attempt, suspend service access
    // TODO: Trigger customer support notification

    return { success: true, invoiceId: id, invoiceRecordId: inv.id };
  } catch (error) {
    console.error('Error handling invoice payment failed:', error);
    throw error;
  }
}

/**
 * Handle checkout session completed
 */
async function handleCheckoutSessionCompleted(session) {
  const { id, customer, customer_email, mode, payment_status, subscription, metadata } = session;
  
  console.log(`🛒 Checkout completed: ${id}`);
  console.log(`   Mode: ${mode}`);
  console.log(`   Payment status: ${payment_status}`);
  console.log(`   Customer: ${customer || customer_email}`);

  try {
    await prisma.aiEvent.create({
      data: {
        type: 'checkout.session.completed',
        payload: {
          sessionId: id,
          customer,
          customerEmail: customer_email,
          mode,
          paymentStatus: payment_status,
          subscription,
          metadata,
          timestamp: new Date().toISOString(),
        },
      },
    });

    // TODO:
    // - Send order confirmation email
    // - Fulfill order (physical/digital goods)
    // - Update user account
    // - Trigger onboarding if new customer

    return { success: true, sessionId: id };
  } catch (error) {
    console.error('Error handling checkout session completed:', error);
    throw error;
  }
}

module.exports = {
  handlePaymentIntentSucceeded,
  handlePaymentIntentFailed,
  handleSubscriptionCreated,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted,
  handleInvoicePaymentSucceeded,
  handleInvoicePaymentFailed,
  handleCheckoutSessionCompleted,
};
