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
    <Card variant="elevated" className="p-6 min-h-[160px]">
      <div className="flex flex-col items-center justify-center space-y-4 text-center h-full">
        <div className="text-4xl mb-4">{deviceIcon}</div>
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
