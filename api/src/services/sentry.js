/**
 * Sentry Error Tracking Configuration
 * Handles error reporting and performance monitoring
 */

const Sentry = require('@sentry/node');

const initializeSentry = (app) => {
  if (!process.env.SENTRY_DSN) {
    console.warn('⚠️  SENTRY_DSN not configured. Error tracking disabled.');
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express({
        app: true,
        request: true,
        transaction: 'path',
        serverName: false,
        user: ['id', 'email'],
      }),
    ],
  });

  // Attach request handler to Express
  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());

  // Attach error handler AFTER all other middleware
  app.use(Sentry.Handlers.errorHandler());

  console.log('✅ Sentry error tracking initialized');
};

const captureException = (error, context = {}) => {
  Sentry.captureException(error, {
    contexts: { additional: context },
  });
};

const captureMessage = (message, level = 'info') => {
  Sentry.captureMessage(message, level);
};

const withSentryContext = (userId, metadata = {}) => {
  Sentry.setUser({ id: userId });
  Sentry.setContext('metadata', metadata);
};

module.exports = {
  initializeSentry,
  captureException,
  captureMessage,
  withSentryContext,
  Sentry,
};
