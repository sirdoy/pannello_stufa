'use client';

import { useReportWebVitals } from 'next/web-vitals';

export function WebVitals() {
  useReportWebVitals((metric) => {
    // Console logging (dev debugging)
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `[Vital] ${metric.name}: ${metric.value.toFixed(1)} (${metric.rating})`
      );
    }
  });

  return null; // renders nothing
}
