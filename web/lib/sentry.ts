/**
 * Sentry Configuration for Next.js
 * Error tracking and performance monitoring
 */

import * as Sentry from '@sentry/react';

export function initSentry() {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
    console.warn('⚠️  NEXT_PUBLIC_SENTRY_DSN not configured. Error tracking disabled.');
    return;
  }

  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    beforeSend(event: any) {
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
