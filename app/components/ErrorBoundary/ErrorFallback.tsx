'use client';

import { FallbackProps } from 'react-error-boundary';
import { Card, Button, Heading, Text } from '@/app/components/ui';

interface ErrorFallbackProps extends FallbackProps {
  deviceName: string;
  deviceIcon: string;
}

export default function ErrorFallback({
  error,
  resetErrorBoundary,
  deviceName,
  deviceIcon,
}: ErrorFallbackProps) {
  const errorMessage =
    error instanceof Error ? error.message : 'Si è verificato un errore imprevisto';

  return (
    <Card variant="elevated" className="min-h-40 p-6">
      <div className="flex h-full flex-col items-center justify-center space-y-4 text-center">
        <div className="mb-4 text-4xl">{deviceIcon}</div>
        <Heading level={3} variant="ember">
          Errore: {deviceName}
        </Heading>
        <Text variant="secondary">{errorMessage}</Text>
        <Button variant="ember" onClick={resetErrorBoundary}>
          Riprova
        </Button>
      </div>
    </Card>
  );
}
