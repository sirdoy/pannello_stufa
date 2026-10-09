'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lightbulb } from 'lucide-react';
import { Card, Text } from '@/app/components/ui';

export default function HueAuthorizedPage() {
  const router = useRouter();
  const [status, setStatus] = useState<string>('Verifica autenticazione...');

  useEffect(() => {
    async function checkAndRedirect(): Promise<void> {
      try {
        // Wait a moment for callback to finish processing
        await new Promise(resolve => setTimeout(resolve, 1500));

        setStatus('Connesso con successo! Reindirizzamento...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        router.replace('/');
      } catch (err) {
        console.error('Error during redirect:', err);
        setStatus('Errore. Reindirizzamento...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        router.replace('/');
      }
    }

    checkAndRedirect();
  }, [router]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <Card className="p-12 text-center">
        <Lightbulb size={32} className="mx-auto mb-6 animate-pulse text-warning-400" aria-hidden="true" />
        <Text size="lg" weight="medium">{status}</Text>
      </Card>
    </div>
  );
}
