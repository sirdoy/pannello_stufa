'use client';

import { ErrorBoundary } from 'react-error-boundary';
import { ValidationError } from '@/lib/errors';
import ErrorFallback from './ErrorFallback';

interface DeviceCardErrorBoundaryProps {
  children: React.ReactNode;
  deviceName: string;
  deviceIcon: string;
}

export default function DeviceCardErrorBoundary({
  children,
  deviceName,
  deviceIcon,
}: DeviceCardErrorBoundaryProps) {
  const handleError = (error: unknown) => {
    // Re-throw ValidationError to bypass boundary (let it bubble up for safety alerts)
    if (error instanceof ValidationError) {
      throw error;
    }

    // For all other errors: log to analytics via fire-and-forget
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    fetch('/api/analytics/error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        device: deviceName,
        component: 'DeviceCard',
        message: errorMessage,
        stack: errorStack,
      }),
    }).catch(() => {
      // Fire-and-forget: ignore fetch failures
    });
  };

  return (
    <ErrorBoundary
      FallbackComponent={(props) => (
        <ErrorFallback {...props} deviceName={deviceName} deviceIcon={deviceIcon} />
      )}
      onError={handleError}
    >
      {children}
    </ErrorBoundary>
  );
}
