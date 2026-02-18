'use client';

import { useReportWebVitals } from 'next/web-vitals';

export function WebVitals() {
  useReportWebVitals((metric) => {
    // 1. Console logging (dev debugging)
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `[Vital] ${metric.name}: ${metric.value.toFixed(1)} (${metric.rating})`
      );
    }

    // 2. Analytics pipeline (always — NOT consent-gated per user decision)
    const body = JSON.stringify({
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      id: metric.id,
      url: typeof window !== 'undefined' ? window.location.pathname : '/',
      timestamp: new Date().toISOString(),
    });

    // sendBeacon: non-blocking, survives page unload
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon('/api/vitals', body);
    } else if (typeof fetch !== 'undefined') {
      fetch('/api/vitals', { method: 'POST', body, keepalive: true }).catch(() => {
        // Silently ignore — fire-and-forget
      });
    }
  });

  return null; // renders nothing
}
