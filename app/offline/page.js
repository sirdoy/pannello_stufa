'use client';

import { Card, Heading, Text, Button } from '@/app/components/ui';

export default function OfflinePage() {
  return (
    <div className="max-w-2xl mx-auto py-12">
      <Card className="p-8 text-center">
        <Text className="text-6xl mb-4">📡</Text>
        <Heading level={1} size="2xl" className="mb-4">
          Connessione assente
        </Heading>
        <Text variant="tertiary" className="mb-6">
          Al momento non sei connesso a Internet. Alcune funzionalità potrebbero non essere disponibili.
        </Text>
        <Text variant="tertiary" size="sm">
          L&apos;app si riconnetterà automaticamente quando la connessione sarà ripristinata.
        </Text>
        <Button
          variant="ember"
          size="lg"
          onClick={() => window.location.reload()}
          className="mt-8"
        >
          Riprova
        </Button>
      </Card>
    </div>
  );
}
