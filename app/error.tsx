'use client';

/**
 * Global Error Boundary
 *
 * Next.js route-level error boundary that catches unhandled errors in the app.
 * Displays Ember Noir fallback UI with retry button.
 *
 * IMPORTANT:
 * - Does NOT catch ValidationError (component boundaries check instanceof)
 *
 * Reference: https://nextjs.org/docs/app/api-reference/file-conventions/error
 */

import { useEffect } from 'react';
import { Button, Heading, Text } from '@/app/components/ui';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <div className="max-w-md text-center">
        <Heading level={2} variant="ember" className="mb-4">
          Qualcosa e andato storto
        </Heading>

        <Text variant="secondary" className="mb-6">
          {error.message || 'Si e verificato un errore inaspettato'}
        </Text>

        <Button variant="ember" onClick={() => reset()}>
          Riprova
        </Button>
      </div>
    </div>
  );
}
