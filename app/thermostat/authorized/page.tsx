'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/app/components/ui';

export default function NetatmoAuthorizedPage() {
  const router = useRouter();
  const [status, setStatus] = useState<string>('Verifica autenticazione...');

  useEffect(() => {
    async function checkAndRedirect() {
      try {
        // Wait a moment for callback to finish processing
        await new Promise(resolve => setTimeout(resolve, 1500));

        setStatus('✅ Connesso con successo! Reindirizzamento...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        router.replace('/thermostat');
      } catch (err) {
        console.error('Error during redirect:', err);
        setStatus('❌ Errore. Reindirizzamento...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        router.replace('/thermostat');
      }
    }

    checkAndRedirect();
  }, [router]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <Card className="p-12 text-center">
        <div className="mb-6">
          <div className="mx-auto flex size-16 animate-pulse items-center justify-center rounded-full bg-linear-to-br from-ocean-100 to-ocean-200">
            <span className="text-3xl">🔗</span>
          </div>
        </div>
        <p className="text-lg font-medium text-slate-100">{status}</p>
      </Card>
    </div>
  );
}
