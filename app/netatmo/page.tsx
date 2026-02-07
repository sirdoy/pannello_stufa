'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, Button, Skeleton, Banner, Heading, Text } from '@/app/components/ui';
import NetatmoAuthCard from '@/app/components/netatmo/NetatmoAuthCard';
import { NETATMO_ROUTES } from '@/lib/routes';

function NetatmoHubContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [connected, setConnected] = useState<boolean>(false);
  const [oauthError, setOauthError] = useState<string | null>(null);
  const connectionCheckedRef = useRef<boolean>(false);

  // Check for OAuth callback errors in URL
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setOauthError(decodeURIComponent(errorParam));
      // Clear error from URL without reload
      window.history.replaceState({}, '', '/netatmo');
    }
  }, [searchParams]);

  // Check connection status on mount
  useEffect(() => {
    if (connectionCheckedRef.current) return;
    connectionCheckedRef.current = true;
    checkConnection();
  }, []);

  async function checkConnection(): Promise<void> {
    try {
      setLoading(true);
      const response = await fetch(NETATMO_ROUTES.homesData);
      const data: any = await response.json();

      // Check if connected (has valid token)
      if (!data.reconnect && !data.error && data.home_id) {
        setConnected(true);
      } else if (data.error && !data.error.includes('refresh token') && !data.error.includes('Nessun refresh token')) {
        // Connected but API error - still show as connected
        setConnected(true);
      } else {
        setConnected(false);
      }
    } catch (err) {
      console.error('Error checking Netatmo connection:', err);
      setConnected(false);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <Skeleton.Card className="min-h-[400px]" />
      </div>
    );
  }

  // Not connected - show auth card
  if (!connected) {
    return (
      <>
        {/* Show OAuth error banner if present */}
        {oauthError && (
          <div className="max-w-2xl mx-auto px-4 pt-8">
            <Banner
              variant="error"
              icon="❌"
              title="Errore Connessione Netatmo"
              description={oauthError}
              dismissible
              onDismiss={() => setOauthError(null)}
            />
          </div>
        )}
        <NetatmoAuthCard />
      </>
    );
  }

  // Connected - show hub with navigation options
  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      {/* Show OAuth error banner if present */}
      {oauthError && (
        <div className="mb-6">
          <Banner
            variant="error"
            icon="❌"
            title="Errore Connessione Netatmo"
            description={oauthError}
            dismissible
            onDismiss={() => setOauthError(null)}
          />
        </div>
      )}

      <Card className="p-8 text-center">
        {/* Icon */}
        <div className="mb-6">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-sage-900/40 [html:not(.dark)_&]:from-sage-100 to-sage-800/40 [html:not(.dark)_&]:to-sage-200 rounded-3xl flex items-center justify-center">
            <span className="text-4xl">✅</span>
          </div>
        </div>

        {/* Title */}
        <Heading level={2} size="2xl" className="mb-3">
          Netatmo Connesso
        </Heading>

        {/* Description */}
        <Text variant="secondary" className="mb-8 leading-relaxed">
          Il tuo account Netatmo è connesso. Scegli cosa vuoi gestire.
        </Text>

        {/* Navigation Options */}
        <div className="space-y-4">
          <Button
            variant="primary"
            onClick={() => router.push('/thermostat')}
            className="w-full"
          >
            <span className="flex items-center justify-center gap-3">
              <span className="text-xl">🌡️</span>
              <span>Termostato e Valvole</span>
            </span>
          </Button>

          <Button
            variant="ocean"
            onClick={() => router.push('/camera')}
            className="w-full"
          >
            <span className="flex items-center justify-center gap-3">
              <span className="text-xl">📹</span>
              <span>Videocamere</span>
            </span>
          </Button>
        </div>

        {/* Disconnect option */}
        <div className="mt-8 pt-6 border-t border-slate-700/50 [html:not(.dark)_&]:border-slate-200">
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              await fetch(NETATMO_ROUTES.disconnect, { method: 'POST' });
              setConnected(false);
              connectionCheckedRef.current = false;
            }}
          >
            Disconnetti Netatmo
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default function NetatmoHubPage() {
  return (
    <Suspense fallback={
      <div className="max-w-2xl mx-auto px-4 py-16">
        <Skeleton.Card className="min-h-[400px]" />
      </div>
    }>
      <NetatmoHubContent />
    </Suspense>
  );
}
