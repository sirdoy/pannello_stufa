'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/app/components/ui';

export default function NetatmoAuthorizedPage() {
  const router = useRouter();
  const [status, setStatus] = useState('Verifica autenticazione...');

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
    <div className="max-w-2xl mx-auto px-4 py-16">
      <Card className="p-12 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-info-100 to-info-200 rounded-full flex items-center justify-center animate-pulse">
            <span className="text-3xl">🔗</span>
          </div>
        </div>
        <p className="text-lg font-medium text-neutral-900">{status}</p>
      </Card>
    </div>
  );
}
