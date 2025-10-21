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
import Card from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import Banner from '@/app/components/ui/Banner';
import Skeleton from '@/app/components/ui/Skeleton';

export default function DevicesSettingsPage() {
  const { user, isLoading: userLoading } = useUser();
  const router = useRouter();
  const [devices, setDevices] = useState([]);
  const [preferences, setPreferences] = useState({});
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
  const handleToggleDevice = (deviceId) => {
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
      alert('Errore nel salvataggio: ' + error.message);
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
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-100 p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-100 p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <Banner variant="warning">
            Devi effettuare l&apos;accesso per gestire i dispositivi
          </Banner>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">
            Gestione Dispositivi
          </h1>
          <p className="text-sm sm:text-base text-neutral-600 mt-2">
            Abilita o disabilita i dispositivi da visualizzare in homepage e nel menu
          </p>
        </div>

        {/* Success message */}
        {saveSuccess && (
          <Banner variant="success">
            Preferenze salvate con successo! La pagina verrà aggiornata...
          </Banner>
        )}

        {/* Info banner */}
        <Banner variant="info">
          I dispositivi disabilitati non verranno mostrati nella homepage e non appariranno nel menu di navigazione. Puoi abilitarli in qualsiasi momento da questa pagina.
        </Banner>

        {/* Devices list */}
        <Card liquid className="p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            Dispositivi Disponibili
          </h2>

          <div className="space-y-4">
            {devices.map(device => {
              const isEnabled = preferences[device.id] === true;

              return (
                <div
                  key={device.id}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                    isEnabled
                      ? 'border-primary-200 bg-primary-50/50'
                      : 'border-neutral-200 bg-neutral-50/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Device info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{device.icon}</span>
                        <h3 className="text-base font-semibold text-neutral-900">
                          {device.name}
                        </h3>
                        {isEnabled && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-700">
                            Attivo
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-neutral-600 ml-11">
                        {device.description}
                      </p>
                    </div>

                    {/* Toggle button */}
                    <button
                      onClick={() => handleToggleDevice(device.id)}
                      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 flex-shrink-0 ${
                        isEnabled
                          ? 'bg-primary-500'
                          : 'bg-neutral-300'
                      }`}
                      role="switch"
                      aria-checked={isEnabled}
                      aria-label={`${isEnabled ? 'Disabilita' : 'Abilita'} ${device.name}`}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-200 ${
                          isEnabled ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Action buttons */}
        {hasChanges && (
          <Card liquid className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-neutral-900">
                  Hai modifiche non salvate
                </p>
                <p className="text-xs text-neutral-600 mt-1">
                  Salva le modifiche per applicarle alla navigazione
                </p>
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
                  variant="primary"
                  onClick={handleSave}
                  disabled={isSaving}
                  liquid
                  className="flex-1 sm:flex-initial"
                >
                  {isSaving ? 'Salvataggio...' : 'Salva modifiche'}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Info card */}
        <Card liquid className="p-6 bg-neutral-50/50">
          <h3 className="text-base font-semibold text-neutral-900 mb-3">
            ℹ️ Note
          </h3>
          <ul className="space-y-2 text-sm text-neutral-700">
            <li className="flex gap-2">
              <span className="text-primary-500 flex-shrink-0">•</span>
              <span>I dispositivi disabilitati non verranno eliminati, potrai riattivarli quando vuoi</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary-500 flex-shrink-0">•</span>
              <span>Le modifiche saranno visibili immediatamente dopo il salvataggio</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary-500 flex-shrink-0">•</span>
              <span>La configurazione è personale e non influisce sugli altri utenti</span>
            </li>
          </ul>
        </Card>

      </div>
    </div>
  );
}
