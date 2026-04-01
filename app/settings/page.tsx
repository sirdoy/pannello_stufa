'use client';

/**
 * Unified Settings Page
 *
 * Consolidates settings into a single tabbed interface:
 * - Theme (Aspetto)
 * - Location (Posizione)
 * - Devices (Dispositivi) - unified device + dashboard settings
 *
 * Complex pages (Notifications, Thermostat) remain separate.
 */

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';
import SettingsLayout from '@/app/components/SettingsLayout';
import Tabs from '@/app/components/ui/Tabs';
import Card from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import Toggle from '@/app/components/ui/Toggle';
import Banner from '@/app/components/ui/Banner';
import Badge from '@/app/components/ui/Badge';
import Skeleton from '@/app/components/ui/Skeleton';
import { Heading, Text } from '@/app/components/ui';
import LocationSearch from '@/app/components/LocationSearch';
import { MapPin, Smartphone, ChevronUp, ChevronDown } from 'lucide-react';

/**
 * LocationContent - Extracted from location/page.js
 */
interface LocationData {
  latitude: number;
  longitude: number;
  name: string;
}

interface SaveMessage {
  type: 'success' | 'error';
  text: string;
}

function LocationContent() {
  const { user } = useUser();
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
    } else {
      setIsLoading(false);
    }
  }, [user]);

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

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <div className="space-y-6 mt-6">
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
            variant={saveMessage.type === 'success' ? 'success' : 'error'}
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
    </div>
  );
}


interface UnifiedDevice {
  id: string;
  name: string;
  icon: string;
  description: string;
  visible: boolean;
  order: number;
  isDisplayOnly?: boolean;
  hasHomepageCard?: boolean;
}

/**
 * UnifiedDevicesContent - Unified device settings
 * Single toggle controls visibility (navbar for hardware, homepage for all)
 * Order controls homepage card position
 */
function UnifiedDevicesContent() {
  const { user } = useUser();
  const router = useRouter();
  const [devices, setDevices] = useState<UnifiedDevice[]>([]);
  const [originalDevices, setOriginalDevices] = useState<UnifiedDevice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load device config
  useEffect(() => {
    if (!user?.sub) {
      setIsLoading(false);
      return;
    }

    fetchDeviceConfig();
  }, [user?.sub]);

  const fetchDeviceConfig = async () => {
    try {
      const response = await fetch('/api/devices/config');

      if (!response.ok) {
        throw new Error('Errore nel caricamento della configurazione');
      }

      const data = await response.json();
      setDevices(data.devices);
      setOriginalDevices(JSON.parse(JSON.stringify(data.devices)));
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching device config:', error);
      setIsLoading(false);
    }
  };

  // Check if there are unsaved changes
  useEffect(() => {
    const changed = JSON.stringify(devices) !== JSON.stringify(originalDevices);
    setHasChanges(changed);
    if (changed) setSaveSuccess(false);
  }, [devices, originalDevices]);

  // Toggle device visibility
  const handleToggleVisible = (deviceId: string) => {
    setDevices(prev =>
      prev.map(d =>
        d.id === deviceId ? { ...d, visible: !d.visible } : d
      )
    );
  };

  // Move device up in order
  const moveUp = (index: number) => {
    if (index === 0) return;
    setDevices(prev => {
      const newDevices = [...prev];
      const current = newDevices[index];
      const previous = newDevices[index - 1];
      if (!current || !previous) return prev;
      [newDevices[index - 1], newDevices[index]] = [current, previous];
      return newDevices.map((d, i) => ({ ...d, order: i }));
    });
  };

  // Move device down in order
  const moveDown = (index: number) => {
    if (index === devices.length - 1) return;
    setDevices(prev => {
      const newDevices = [...prev];
      const current = newDevices[index];
      const next = newDevices[index + 1];
      if (!current || !next) return prev;
      [newDevices[index], newDevices[index + 1]] = [next, current];
      return newDevices.map((d, i) => ({ ...d, order: i }));
    });
  };

  // Save config
  const handleSave = async () => {
    setIsSaving(true);

    try {
      const payload = {
        devices: devices.map(d => ({
          id: d.id,
          visible: d.visible,
          order: d.order,
        })),
      };

      const response = await fetch('/api/devices/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Errore nel salvataggio');
      }

      setOriginalDevices(JSON.parse(JSON.stringify(devices)));
      setHasChanges(false);
      setSaveSuccess(true);

      // Refresh page after 1s to update navbar
      setTimeout(() => {
        router.refresh();
      }, 1000);

    } catch (error) {
      console.error('Error saving config:', error);
      alert('Errore nel salvataggio: ' + (error instanceof Error ? error.message : 'Errore sconosciuto'));
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to original
  const handleReset = () => {
    setDevices(JSON.parse(JSON.stringify(originalDevices)));
    setHasChanges(false);
    setSaveSuccess(false);
  };

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <div className="space-y-6 mt-6">
      {/* Description */}
      <Text variant="tertiary" className="text-sm sm:text-base">
        Scegli quali dispositivi mostrare e in che ordine
      </Text>

      {/* Success message */}
      {saveSuccess && (
        <Banner variant="success">
          Configurazione salvata! La pagina verrà aggiornata...
        </Banner>
      )}

      {/* Devices list */}
      <Card variant="glass" className="p-4 sm:p-6">
        <div className="space-y-3">
          {devices.map((device, index) => {
            const isVisible = device.visible;

            return (
              <div
                key={device.id}
                className={`p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 ${
                  isVisible
                    ? 'border-ember-600/50 [html:not(.dark)_&]:border-ember-300 bg-ember-950/10 [html:not(.dark)_&]:bg-ember-50/30'
                    : 'border-slate-700/30 [html:not(.dark)_&]:border-slate-200 bg-slate-900/20 [html:not(.dark)_&]:bg-slate-100/50 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between gap-2 sm:gap-4">
                  {/* Left: Icon + Name + Description + Badges */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="text-2xl flex-shrink-0">{device.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Text className="truncate">{device.name}</Text>
                        {device.isDisplayOnly && (
                          <Badge variant="ocean" size="sm">solo home</Badge>
                        )}
                        {!device.hasHomepageCard && (
                          <Badge variant="neutral" size="sm">solo menu</Badge>
                        )}
                      </div>
                      <Text variant="tertiary" size="xs" className="hidden sm:block truncate">
                        {device.description}
                      </Text>
                    </div>
                  </div>

                  {/* Right: Toggle + Order buttons */}
                  <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                    {/* Visibility toggle */}
                    <Toggle
                      checked={isVisible}
                      onChange={() => handleToggleVisible(device.id)}
                      label={`${isVisible ? 'Nascondi' : 'Mostra'} ${device.name}`}
                      size="md"
                    />

                    {/* Order buttons */}
                    <div className="flex items-center gap-0.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        iconOnly
                        disabled={index === 0}
                        onClick={() => moveUp(index)}
                        aria-label={`Sposta ${device.name} su`}
                      >
                        <ChevronUp size={18} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        iconOnly
                        disabled={index === devices.length - 1}
                        onClick={() => moveDown(index)}
                        aria-label={`Sposta ${device.name} giù`}
                      >
                        <ChevronDown size={18} />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Action buttons */}
      {hasChanges && (
        <Card variant="glass" className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="flex-1">
              <Text size="sm">
                Hai modifiche non salvate
              </Text>
              <Text variant="tertiary" size="xs" className="mt-1">
                Salva per applicare le modifiche
              </Text>
            </div>

            <div className="flex gap-3 flex-shrink-0">
              <Button
                variant="subtle"
                onClick={handleReset}
                disabled={isSaving}
                className="flex-1 sm:flex-initial"
              >
                Annulla
              </Button>
              <Button
                variant="ember"
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 sm:flex-initial"
              >
                {isSaving ? 'Salvataggio...' : 'Salva modifiche'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Info card */}
      <Card variant="glass" className="p-4 sm:p-6 bg-ocean-900/10 [html:not(.dark)_&]:bg-ocean-50/50">
        <Heading level={3} size="md" variant="subtle" className="mb-3">
          ℹ️ Come funziona
        </Heading>
        <ul className="space-y-2">
          <li className="flex gap-2">
            <Text as="span" variant="ember" className="flex-shrink-0">•</Text>
            <Text variant="tertiary" size="sm">
              Il toggle controlla la visibilità del dispositivo (menu e homepage)
            </Text>
          </li>
          <li className="flex gap-2">
            <Text as="span" variant="ember" className="flex-shrink-0">•</Text>
            <Text variant="tertiary" size="sm">
              Usa le frecce per riordinare i dispositivi nella homepage
            </Text>
          </li>
          <li className="flex gap-2">
            <Text as="span" variant="ember" className="flex-shrink-0">•</Text>
            <Text variant="tertiary" size="sm">
              <strong>solo home</strong>: il dispositivo appare solo nella homepage (es. Meteo)
            </Text>
          </li>
          <li className="flex gap-2">
            <Text as="span" variant="ember" className="flex-shrink-0">•</Text>
            <Text variant="tertiary" size="sm">
              <strong>solo menu</strong>: il dispositivo appare solo nel menu (es. Sonos)
            </Text>
          </li>
        </ul>
      </Card>
    </div>
  );
}

/**
 * Main Settings Page Component
 */
function SettingsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoading: userLoading } = useUser();

  const currentTab = searchParams.get('tab') || 'posizione';

  const handleTabChange = (value: string) => {
    router.push(`/settings?tab=${value}`, { scroll: false });
  };

  // Loading state
  if (userLoading) {
    return (
      <SettingsLayout title="Impostazioni" icon="⚙️">
        <Skeleton className="h-64 w-full" />
      </SettingsLayout>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <SettingsLayout title="Impostazioni" icon="⚙️">
        <Card variant="glass">
          <Text variant="secondary">Devi essere autenticato per accedere alle impostazioni.</Text>
        </Card>
      </SettingsLayout>
    );
  }

  return (
    <SettingsLayout title="Impostazioni" icon="⚙️">
      <Tabs value={currentTab} onValueChange={handleTabChange}>
        <Tabs.List>
          <Tabs.Trigger value="posizione" icon={<MapPin size={18} />}>Posizione</Tabs.Trigger>
          <Tabs.Trigger value="dispositivi" icon={<Smartphone size={18} />}>Dispositivi</Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="posizione"><LocationContent /></Tabs.Content>
        <Tabs.Content value="dispositivi"><UnifiedDevicesContent /></Tabs.Content>
      </Tabs>
    </SettingsLayout>
  );
}

/**
 * Wrapped with Suspense for useSearchParams
 */
export default function SettingsPage() {
  return (
    <Suspense fallback={
      <SettingsLayout title="Impostazioni" icon="⚙️">
        <Skeleton className="h-64 w-full" />
      </SettingsLayout>
    }>
      <SettingsPageContent />
    </Suspense>
  );
}
