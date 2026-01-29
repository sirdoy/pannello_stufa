'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import SettingsLayout from '@/app/components/SettingsLayout';
import { Card, Button, Heading, Text, Skeleton, EmptyState, Banner } from '@/app/components/ui';
import DeviceListItem from '@/components/notifications/DeviceListItem';
import { checkStoredToken } from '@/lib/notificationService';

export default function DeviceManagementPage() {
  const { user, isLoading: userLoading } = useUser();
  const [devices, setDevices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentToken, setCurrentToken] = useState(null);

  // Fetch devices
  const fetchDevices = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch('/api/notifications/devices');

      if (!res.ok) {
        throw new Error('Errore nel caricamento dei dispositivi');
      }

      const data = await res.json();
      setDevices(data.devices || []);
    } catch (err) {
      console.error('Error fetching devices:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get current device token
  useEffect(() => {
    const loadCurrentToken = async () => {
      try {
        const result = await checkStoredToken();
        if (result.token) {
          setCurrentToken(result.token);
        }
      } catch (err) {
        console.error('Error loading current token:', err);
      }
    };

    if (user?.sub) {
      loadCurrentToken();
      fetchDevices();
    }
  }, [user?.sub, fetchDevices]);

  // Handle device update (optimistic)
  const handleDeviceUpdate = (tokenKey, updates) => {
    setDevices(prev =>
      prev.map(d =>
        d.tokenKey === tokenKey ? { ...d, ...updates } : d
      )
    );
  };

  // Handle device removal
  const handleDeviceRemove = (tokenKey) => {
    setDevices(prev => prev.filter(d => d.tokenKey !== tokenKey));
  };

  // Loading state
  if (userLoading || (isLoading && !devices.length)) {
    return (
      <SettingsLayout title="Dispositivi Notifiche" icon="📱">
        <div className="space-y-4">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      </SettingsLayout>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <SettingsLayout title="Dispositivi Notifiche" icon="📱">
        <Card liquid className="p-8 text-center">
          <div className="text-6xl mb-4">🔐</div>
          <Heading level={2} size="xl" className="mb-2">
            Autenticazione Richiesta
          </Heading>
          <Text variant="secondary" className="mb-6">
            Devi effettuare il login per gestire i dispositivi
          </Text>
          <Button
            liquid
            variant="primary"
            onClick={() => (window.location.href = '/auth/login')}
          >
            Accedi
          </Button>
        </Card>
      </SettingsLayout>
    );
  }

  // Error state
  if (error && devices.length === 0) {
    return (
      <SettingsLayout title="Dispositivi Notifiche" icon="📱">
        <Card liquid className="p-8 text-center">
          <div className="text-6xl mb-4">❌</div>
          <Heading level={2} size="xl" className="mb-2">
            Errore
          </Heading>
          <Text variant="secondary" className="mb-6">
            {error}
          </Text>
          <Button variant="subtle" onClick={fetchDevices}>
            Riprova
          </Button>
        </Card>
      </SettingsLayout>
    );
  }

  return (
    <SettingsLayout title="Dispositivi Notifiche" icon="📱">
      {/* Description */}
      <div className="space-y-2 mb-6">
        <Text variant="secondary" size="sm">
          Gestisci i dispositivi registrati per le notifiche push.
          Puoi rinominare i dispositivi per identificarli facilmente o rimuovere quelli non più in uso.
        </Text>
      </div>

      {/* Info banner */}
      <Banner
        variant="info"
        description="I dispositivi rimossi non riceveranno più notifiche. I dispositivi inattivi da oltre 30 giorni sono evidenziati come 'Inattivo'."
      />

      {/* Device count */}
      <div className="flex items-center justify-between">
        <Heading level={2} size="lg">
          Dispositivi Registrati
        </Heading>
        <Text variant="secondary" size="sm">
          {devices.length} {devices.length === 1 ? 'dispositivo' : 'dispositivi'}
        </Text>
      </div>

      {/* Device list or empty state */}
      {devices.length === 0 ? (
        <Card liquid className="p-8">
          <EmptyState
            icon="📱"
            title="Nessun dispositivo registrato"
            description="Abilita le notifiche su questo dispositivo per iniziare a ricevere aggiornamenti"
          />
          <div className="mt-6 text-center">
            <Button
              variant="primary"
              onClick={() => (window.location.href = '/settings/notifications')}
            >
              Vai alle impostazioni notifiche
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-3" data-testid="device-list">
          {devices.map(device => (
            <DeviceListItem
              key={device.tokenKey}
              device={device}
              isCurrentDevice={device.token === currentToken}
              onUpdate={handleDeviceUpdate}
              onRemove={handleDeviceRemove}
            />
          ))}
        </div>
      )}

      {/* Refresh button */}
      {devices.length > 0 && (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchDevices}
            disabled={isLoading}
          >
            {isLoading ? 'Aggiornamento...' : '↻ Aggiorna lista'}
          </Button>
        </div>
      )}

      {/* Back link */}
      <Card liquid className="p-4 mt-6">
        <div className="flex items-center justify-between">
          <Text variant="secondary" size="sm">
            Torna alle impostazioni notifiche
          </Text>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => (window.location.href = '/settings/notifications')}
          >
            ← Indietro
          </Button>
        </div>
      </Card>
    </SettingsLayout>
  );
}
