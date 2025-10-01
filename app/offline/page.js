'use client';

import { Card } from '@/app/components/ui';

export default function OfflinePage() {
  return (
    <div className="max-w-2xl mx-auto py-12">
      <Card className="p-8 text-center">
        <div className="text-6xl mb-4">📡</div>
        <h1 className="text-2xl font-bold text-neutral-900 mb-4">
          Connessione assente
        </h1>
        <p className="text-neutral-600 mb-6">
          Al momento non sei connesso a Internet. Alcune funzionalità potrebbero non essere disponibili.
        </p>
        <p className="text-sm text-neutral-500">
          L&apos;app si riconnetterà automaticamente quando la connessione sarà ripristinata.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-8 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl transition-colors duration-200 font-medium"
        >
          Riprova
        </button>
      </Card>
    </div>
  );
}
