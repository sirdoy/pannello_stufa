'use client';

import { useEffect } from 'react';

/**
 * Runtime accessibility auditing with axe-core-react
 * Only runs in development mode
 *
 * Usage: Import in ClientProviders or any client component that renders once
 *
 * Violations are logged to browser console with:
 * - Severity level (critical, serious, moderate, minor)
 * - Element selector
 * - Help text with links to documentation
 */
export default function AxeDevtools() {
  useEffect(() => {
    // Only run in development
    if (process.env.NODE_ENV !== 'development') return;

    // Only run in browser
    if (typeof window === 'undefined') return;

    // Dynamic import to avoid bundling in production
    import('@axe-core/react')
      .then((axe) => {
        const React = require('react');
        const ReactDOM = require('react-dom');

        // Initialize with 1 second debounce to avoid spam during rapid updates
        axe.default(React, ReactDOM, 1000);

        console.log('[Accessibility] axe-core-react initialized - violations will be logged to console');
      })
      .catch(() => {
        // Silently fail if axe-core not installed
        // This allows the component to be committed without the dev dependency
      });
  }, []);

  return null;
}
