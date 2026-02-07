'use client';

/**
 * Location Settings Page
 *
 * Configure app-wide location for weather display.
 * Uses SettingsLayout pattern from theme page.
 *
 * Features:
 * - City search with autocomplete
 * - Geolocation detection
 * - Manual coordinate entry
 * - Firebase persistence
 */

import { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import SettingsLayout from '@/app/components/SettingsLayout';
import Card from '@/app/components/ui/Card';
import { Text, Heading, Banner } from '@/app/components/ui';
import Skeleton from '@/app/components/ui/Skeleton';
import LocationSearch from '@/app/components/LocationSearch';

interface LocationData {
  city: string;
  lat: number;
  lon: number;
}

interface SaveMessage {
  type: 'success' | 'error';
  text: string;
}

export default function LocationSettingsPage() {
  const { user, isLoading: userLoading } = useUser();
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<SaveMessage | null>(null);

  // Fetch current location on mount
  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const response = await fetch('/api/config/location');
        if (response.ok) {
          const data = await response.json();
          setCurrentLocation(data.location);
        }
        // 404 means not configured - that's OK
      } catch (err) {
        console.error('Error fetching location:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchLocation();
    } else if (!userLoading) {
      setIsLoading(false);
    }
  }, [user, userLoading]);

  // Handle location selection from LocationSearch
  const handleLocationSelected = async (location: LocationData) => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const response = await fetch('/api/config/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(location),
      });

      if (response.ok) {
        setCurrentLocation(location);
        setSaveMessage({ type: 'success', text: 'Posizione salvata!' });
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        const data = await response.json();
        setSaveMessage({
          type: 'error',
          text: data.error || 'Errore durante il salvataggio',
        });
      }
    } catch (err) {
      setSaveMessage({ type: 'error', text: 'Errore di connessione' });
    } finally {
      setIsSaving(false);
    }
  };

  // Loading state
  if (userLoading || isLoading) {
    return (
      <SettingsLayout title="Posizione" icon="📍">
        <Skeleton className="h-64 w-full" />
      </SettingsLayout>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <SettingsLayout title="Posizione" icon="📍">
        <Card variant="glass">
          <Text variant="secondary">
            Devi essere autenticato per configurare la posizione.
          </Text>
        </Card>
      </SettingsLayout>
    );
  }

  return (
    <SettingsLayout title="Posizione" icon="📍">
      {/* Description */}
      <Text variant="secondary">
        Configura la posizione per le previsioni meteo
      </Text>

      {/* Main settings card */}
      <Card variant="glass" className="p-6 sm:p-8">
        <Heading level={2} size="lg" className="mb-4">
          Posizione Meteo
        </Heading>

        <LocationSearch
          onLocationSelected={handleLocationSelected}
          currentLocation={currentLocation}
        />

        {/* Save feedback */}
        {saveMessage && (
          <Banner
            variant={saveMessage.type === 'success' ? 'success' : 'danger'}
            compact
            className="mt-4"
          >
            {saveMessage.text}
          </Banner>
        )}

        {/* Saving indicator */}
        {isSaving && (
          <Banner variant="info" compact className="mt-4">
            Salvataggio in corso...
          </Banner>
        )}
      </Card>

      {/* Info card */}
      <Card
        variant="glass"
        className="p-6 sm:p-8 bg-ocean-50/50 [html:not(.dark)_&]:bg-ocean-50/50 bg-ocean-900/10 border border-ocean-200 [html:not(.dark)_&]:border-ocean-200 border-ocean-800"
      >
        <div className="flex gap-3">
          <div className="text-2xl">ℹ️</div>
          <div className="flex-1">
            <Heading level={3} size="md" variant="info" className="mb-1">
              Posizione Condivisa
            </Heading>
            <Text variant="info" size="sm">
              La posizione è condivisa per l&apos;intera app. Tutti i
              dispositivi vedranno lo stesso meteo.
            </Text>
          </div>
        </div>
      </Card>
    </SettingsLayout>
  );
}
