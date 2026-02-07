'use client';

/**
 * Pagina Impostazioni Dispositivi
 *
 * Permette di abilitare/disabilitare dispositivi della smart home.
 * I dispositivi disabilitati non appaiono in homepage e nel menu.
 */

import { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/navigation';
import SettingsLayout from '@/app/components/SettingsLayout';
import Card from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import Banner from '@/app/components/ui/Banner';
import Badge from '@/app/components/ui/Badge';
import Toggle from '@/app/components/ui/Toggle';
import Skeleton from '@/app/components/ui/Skeleton';
import Heading from '@/app/components/ui/Heading';
import Text from '@/app/components/ui/Text';

interface Device {
  id: string;
  name: string;
  icon: string;
  description: string;
}

interface DevicePreferences {
  [deviceId: string]: boolean;
}

export default function DevicesSettingsPage() {
  const { user, isLoading: userLoading } = useUser();
  const router = useRouter();
  const [devices, setDevices] = useState<Device[]>([]);
  const [preferences, setPreferences] = useState<DevicePreferences>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load device preferences
  useEffect(() => {
    if (!user?.sub) {
      setIsLoading(false);
      return;
    }

    fetchDevicePreferences();
  }, [user?.sub]);

  const fetchDevicePreferences = async () => {
    try {
      const response = await fetch('/api/devices/preferences');

      if (!response.ok) {
        throw new Error('Errore nel caricamento delle preferenze');
      }

      const data = await response.json();
      setDevices(data.devices);
      setPreferences(data.preferences);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching device preferences:', error);
      setIsLoading(false);
    }
  };

  // Toggle device
  const handleToggleDevice = (deviceId: string) => {
    const newPreferences = {
      ...preferences,
      [deviceId]: !preferences[deviceId],
    };
    setPreferences(newPreferences);
    setHasChanges(true);
    setSaveSuccess(false);
  };

  // Save preferences
  const handleSave = async () => {
    setIsSaving(true);

    try {
      const response = await fetch('/api/devices/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ preferences }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Errore nel salvataggio');
      }

      setHasChanges(false);
      setSaveSuccess(true);

      // Refresh page after 1s to update navbar
      setTimeout(() => {
        router.refresh();
      }, 1000);

    } catch (error) {
      console.error('Error saving preferences:', error);
      alert('Errore nel salvataggio: ' + (error instanceof Error ? error.message : 'Errore sconosciuto'));
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to defaults
  const handleReset = () => {
    fetchDevicePreferences();
    setHasChanges(false);
    setSaveSuccess(false);
  };

  // Loading state
  if (userLoading || isLoading) {
    return (
      <SettingsLayout title="Gestione Dispositivi" icon="📱">
        <Skeleton className="h-96 w-full" />
      </SettingsLayout>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <SettingsLayout title="Gestione Dispositivi" icon="📱">
        <Banner variant="warning">
          Devi effettuare l&apos;accesso per gestire i dispositivi
        </Banner>
      </SettingsLayout>
    );
  }

  return (
    <SettingsLayout title="Gestione Dispositivi" icon="📱">
      {/* Description */}
      <Text variant="tertiary" className="text-sm sm:text-base">
        Abilita o disabilita i dispositivi da visualizzare in homepage e nel menu
      </Text>

      {/* Success message */}
      {saveSuccess && (
        <Banner variant="success">
          Preferenze salvate con successo! La pagina verrà aggiornata...
        </Banner>
      )}

      {/* Info banner */}
      <Banner
        variant="info"
        description="I dispositivi disabilitati non verranno mostrati nella homepage e non appariranno nel menu di navigazione. Puoi abilitarli in qualsiasi momento da questa pagina."
      />

      {/* Devices list */}
      <Card variant="glass" className="p-6">
        <Heading level={2} size="lg" weight="semibold" className="mb-4">
          Dispositivi Disponibili
        </Heading>

        <div className="space-y-4">
          {devices.map((device, index) => {
            const isEnabled = preferences[device.id] === true;

            return (
              <div
                key={device.id}
                className={`stagger-item p-4 rounded-xl border-2 transition-all duration-200 ${
                  isEnabled
                    ? 'border-ember-600 [html:not(.dark)_&]:border-ember-400 bg-ember-950/30 [html:not(.dark)_&]:bg-ember-50/50'
                    : 'border-slate-600 [html:not(.dark)_&]:border-slate-300 bg-white/[0.02] [html:not(.dark)_&]:bg-slate-50/50'
                }`}
                style={{ '--stagger-index': index }}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Device info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Text className="text-2xl">{device.icon}</Text>
                      <Heading level={3} size="base" weight="semibold">
                        {device.name}
                      </Heading>
                      {isEnabled && (
                        <Badge variant="sage" size="sm">Attivo</Badge>
                      )}
                    </div>
                    <Text variant="secondary" size="sm" className="ml-11">
                      {device.description}
                    </Text>
                  </div>

                  {/* Toggle component */}
                  <Toggle
                    checked={isEnabled}
                    onChange={() => handleToggleDevice(device.id)}
                    label={`${isEnabled ? 'Disabilita' : 'Abilita'} ${device.name}`}
                    size="md"
                  />
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
              <Text size="sm" weight="medium">
                Hai modifiche non salvate
              </Text>
              <Text variant="tertiary" size="xs" className="mt-1">
                Salva le modifiche per applicarle alla navigazione
              </Text>
            </div>

            <div className="flex gap-3 flex-shrink-0">
              <Button
                variant="neutral"
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
      <Card variant="glass" className="p-6 bg-ocean-900/10 [html:not(.dark)_&]:bg-ocean-50/50">
        <Heading level={3} size="base" weight="semibold" variant="ocean" className="mb-3">
          ℹ️ Note
        </Heading>
        <ul className="space-y-2">
          <li className="flex gap-2">
            <Text as="span" variant="ember" className="flex-shrink-0">•</Text>
            <Text as="span" variant="ocean" size="sm">I dispositivi disabilitati non verranno eliminati, potrai riattivarli quando vuoi</Text>
          </li>
          <li className="flex gap-2">
            <Text as="span" variant="ember" className="flex-shrink-0">•</Text>
            <Text as="span" variant="ocean" size="sm">Le modifiche saranno visibili immediatamente dopo il salvataggio</Text>
          </li>
          <li className="flex gap-2">
            <Text as="span" variant="ember" className="flex-shrink-0">•</Text>
            <Text as="span" variant="ocean" size="sm">La configurazione è personale e non influisce sugli altri utenti</Text>
          </li>
        </ul>
      </Card>
    </SettingsLayout>
  );
}
