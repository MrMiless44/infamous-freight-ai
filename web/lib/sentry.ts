/**
 * Sentry Configuration for Next.js
 * Error tracking and performance monitoring
 */

import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

export function initSentry() {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
    console.warn('⚠️  NEXT_PUBLIC_SENTRY_DSN not configured. Error tracking disabled.');
    return;
  }

  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    integrations: [
      new BrowserTracing({
        routingInstrumentation: Sentry.reactRouterV6Instrumentation(
          typeof window !== 'undefined' ? window.history : null
        ),
      }),
    ],
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    beforeSend(event) {
      // Filter out certain errors
      if (event.exception) {
        const error = event.exception.values?.[0];
        if (error?.value?.includes?.('ResizeObserver')) {
          return null;
        }
      }
      return event;
    },
  });
}

export { Sentry };
