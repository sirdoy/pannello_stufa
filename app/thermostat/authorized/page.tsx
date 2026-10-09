'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Link2 } from 'lucide-react';
import { Card, Text } from '@/app/components/ui';

export default function NetatmoAuthorizedPage() {
  const router = useRouter();
  const [status, setStatus] = useState<string>('Verifica autenticazione...');

  useEffect(() => {
    async function checkAndRedirect() {
      try {
        // Wait a moment for callback to finish processing
        await new Promise(resolve => setTimeout(resolve, 1500));

        setStatus('Connesso con successo! Reindirizzamento...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        router.replace('/thermostat');
      } catch (err) {
        console.error('Error during redirect:', err);
        setStatus('Errore. Reindirizzamento...');
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
          <div className="mx-auto flex size-16 animate-pulse items-center justify-center rounded-full bg-white/6">
            <Link2 size={28} className="text-(--text-2)" aria-hidden="true" />
          </div>
        </div>
        <Text size="lg" weight="medium">{status}</Text>
      </Card>
    </div>
  );
}
