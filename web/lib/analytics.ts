/**
 * Google Analytics Configuration for Next.js
 */

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import ReactGA from 'react-ga4';

export function useAnalytics() {
  const router = useRouter();

  useEffect(() => {
    // Initialize Google Analytics
    if (!process.env.NEXT_PUBLIC_GA_ID) {
      console.warn('⚠️  NEXT_PUBLIC_GA_ID not configured. Analytics disabled.');
      return;
    }

    ReactGA.initialize(process.env.NEXT_PUBLIC_GA_ID);

    // Track page views
    const handleRouteChange = (url: string) => {
      ReactGA.send({
        hitType: 'pageview',
        page: url,
      });
    };

    router.events?.on('routeChangeComplete', handleRouteChange);

    return () => {
      router.events?.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events]);
}

export function trackEvent(category: string, action: string, label: string = '', value: number = 0) {
  if (!process.env.NEXT_PUBLIC_GA_ID) return;

  ReactGA.event({
    category,
    action,
    label,
    value,
  });
}

export function trackException(description: string, fatal: boolean = false) {
  if (!process.env.NEXT_PUBLIC_GA_ID) return;

  ReactGA.event({
    category: 'exception',
    action: description,
    label: fatal ? 'fatal' : 'non-fatal',
  });
}
