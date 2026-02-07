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
import { useTheme } from '@/app/context/ThemeContext';
import { THEMES } from '@/lib/themeService';
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
import { Palette, MapPin, Smartphone, ChevronUp, ChevronDown, FlaskConical } from 'lucide-react';
import SandboxToggle from '@/app/components/sandbox/SandboxToggle';

/**
 * ThemeContent - Extracted from theme/page.js
 */
function ThemeContent() {
  const { theme, setTheme, isLoading: themeLoading } = useTheme();
  const [isSaving, setIsSaving] = useState(false);

  const handleThemeChange = async (newTheme: 'light' | 'dark') => {
    setIsSaving(true);
    try {
      await setTheme(newTheme);
    } catch (error) {
      console.error('Errore cambio tema:', error);
      alert('Errore durante il salvataggio del tema');
    } finally {
      setIsSaving(false);
    }
  };

  if (themeLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <div className="space-y-6 mt-6">
      {/* Description */}
      <Text variant="secondary">
        Scegli la modalità chiara o scura per l&apos;interfaccia
      </Text>

      {/* Theme Selector Card */}
      <Card variant="glass" className="p-6 sm:p-8">
        <Heading level={2} size="lg" className="mb-4">
          Modalità Interfaccia
        </Heading>

        <div className="space-y-4">
          {/* Light Mode Option */}
          <button
            onClick={() => handleThemeChange(THEMES.LIGHT)}
            disabled={isSaving}
            className={`
              w-full p-4 rounded-lg border-2 transition-all
              flex items-center justify-between
              ${theme === THEMES.LIGHT
                ? 'border-ember-500 bg-ember-50 [html:not(.dark)_&]:bg-ember-50 bg-ember-900/20'
                : 'border-slate-200 [html:not(.dark)_&]:border-slate-200 border-slate-700 hover:border-slate-300 [html:not(.dark)_&]:hover:border-slate-300 hover:border-slate-600'
              }
              ${isSaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <div className="flex items-center gap-3">
              <div className="text-3xl">☀️</div>
              <div className="text-left">
                <Text variant="body" as="div">
                  Modalità Chiara
                </Text>
                <Text variant="secondary" size="sm" as="div">
                  Sfondo chiaro con elementi glass
                </Text>
              </div>
            </div>
            {theme === THEMES.LIGHT && (
              <div className="flex items-center gap-2 text-ember-400 [html:not(.dark)_&]:text-ember-600">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </button>

          {/* Dark Mode Option */}
          <button
            onClick={() => handleThemeChange(THEMES.DARK)}
            disabled={isSaving}
            className={`
              w-full p-4 rounded-lg border-2 transition-all
              flex items-center justify-between
              ${theme === THEMES.DARK
                ? 'border-ember-500 bg-ember-50 [html:not(.dark)_&]:bg-ember-50 bg-ember-900/20'
                : 'border-slate-200 [html:not(.dark)_&]:border-slate-200 border-slate-700 hover:border-slate-300 [html:not(.dark)_&]:hover:border-slate-300 hover:border-slate-600'
              }
              ${isSaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <div className="flex items-center gap-3">
              <div className="text-3xl">🌙</div>
              <div className="text-left">
                <Text variant="body" as="div">
                  Modalità Scura
                </Text>
                <Text variant="secondary" size="sm" as="div">
                  Sfondo scuro con glass effect
                </Text>
              </div>
            </div>
            {theme === THEMES.DARK && (
              <div className="flex items-center gap-2 text-ember-400 [html:not(.dark)_&]:text-ember-600">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </button>
        </div>

        {/* Status Message */}
        {isSaving && (
          <Banner variant="info" compact className="mt-4">
            Salvataggio tema in corso...
          </Banner>
        )}
      </Card>

      {/* Preview Card */}
      <Card variant="glass" className="p-6 sm:p-8">
        <Heading level={2} size="lg" className="mb-4">
          Preview Tema Corrente
        </Heading>

        <div className="space-y-4">
          {/* Sample elements */}
          <div className="p-4 backdrop-blur-md bg-white/10 [html:not(.dark)_&]:bg-white/10 bg-white/5 rounded-lg border border-white/20 [html:not(.dark)_&]:border-white/20 border-white/10">
            <Text variant="body" className="mb-2">
              Esempio Glass Effect
            </Text>
            <Text variant="secondary" size="sm">
              Questo è un esempio di come appare l&apos;effetto vetro (glass) con il tema {theme === THEMES.LIGHT ? 'chiaro' : 'scuro'}.
              Il blur e la trasparenza creano profondità visiva.
            </Text>
          </div>

          <div className="flex gap-3 flex-wrap">
            <Button variant="ember" size="sm">
              Primario
            </Button>
            <Button variant="subtle" size="sm">
              Secondario
            </Button>
            <Button variant="success" size="sm">
              Successo
            </Button>
            <Button variant="danger" size="sm">
              Pericolo
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-ember-50 [html:not(.dark)_&]:bg-ember-50 bg-ember-900/20 rounded-lg">
              <Text variant="tertiary" size="xs" className="mb-1">Primary</Text>
              <Text variant="ember">Rosso</Text>
            </div>
            <div className="p-3 bg-ocean-50 [html:not(.dark)_&]:bg-ocean-50 bg-ocean-900/20 rounded-lg">
              <Text variant="tertiary" size="xs" className="mb-1">Info</Text>
              <Text variant="tertiary">Blu</Text>
            </div>
            <div className="p-3 bg-sage-50 [html:not(.dark)_&]:bg-sage-50 bg-sage-900/20 rounded-lg">
              <Text variant="tertiary" size="xs" className="mb-1">Success</Text>
              <Text variant="sage">Verde</Text>
            </div>
            <div className="p-3 bg-warning-50 [html:not(.dark)_&]:bg-warning-50 bg-warning-900/20 rounded-lg">
              <Text variant="tertiary" size="xs" className="mb-1">Warning</Text>
              <Text variant="warning">Arancione</Text>
            </div>
          </div>
        </div>
      </Card>

      {/* Info Card */}
      <Card variant="glass" className="p-6 sm:p-8 bg-ocean-50/50 [html:not(.dark)_&]:bg-ocean-50/50 bg-ocean-900/10 border border-ocean-200 [html:not(.dark)_&]:border-ocean-200 border-ocean-800">
        <div className="flex gap-3">
          <div className="text-2xl">ℹ️</div>
          <div className="flex-1">
            <Heading level={3} size="md" variant="info" className="mb-1">
              Sincronizzazione Multi-Device
            </Heading>
            <Text variant="info" size="sm">
              La tua preferenza tema viene salvata su Firebase e sincronizzata automaticamente su tutti i tuoi dispositivi.
            </Text>
          </div>
        </div>
      </Card>
    </div>
  );
}

/**
 * LocationContent - Extracted from location/page.js
 */
interface LocationData {
  city: string;
  lat: number;
  lon: number;
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
      [newDevices[index - 1], newDevices[index]] = [
        newDevices[index],
        newDevices[index - 1],
      ];
      return newDevices.map((d, i) => ({ ...d, order: i }));
    });
  };

  // Move device down in order
  const moveDown = (index: number) => {
    if (index === devices.length - 1) return;
    setDevices(prev => {
      const newDevices = [...prev];
      [newDevices[index], newDevices[index + 1]] = [
        newDevices[index + 1],
        newDevices[index],
      ];
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
      <Card variant="glass" className="p-4 sm:p-6 bg-ocean-900/10 [html:not(.dark)_&]:bg-ocean-50/50">
        <Heading level={3} size="base" variant="subtle" className="mb-3">
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
 * SandboxContent - Sandbox testing toggle
 */
function SandboxContent() {
  return (
    <div className="space-y-6 mt-6">
      <Text variant="secondary">
        Attiva la modalita sandbox per testare senza chiamate reali ai dispositivi
      </Text>
      <SandboxToggle />
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

  const currentTab = searchParams.get('tab') || 'aspetto';

  const handleTabChange = (value) => {
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
          <Tabs.Trigger value="aspetto" icon={<Palette size={18} />}>Aspetto</Tabs.Trigger>
          <Tabs.Trigger value="posizione" icon={<MapPin size={18} />}>Posizione</Tabs.Trigger>
          <Tabs.Trigger value="dispositivi" icon={<Smartphone size={18} />}>Dispositivi</Tabs.Trigger>
          <Tabs.Trigger value="sandbox" icon={<FlaskConical size={18} />}>Sandbox</Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="aspetto"><ThemeContent /></Tabs.Content>
        <Tabs.Content value="posizione"><LocationContent /></Tabs.Content>
        <Tabs.Content value="dispositivi"><UnifiedDevicesContent /></Tabs.Content>
        <Tabs.Content value="sandbox"><SandboxContent /></Tabs.Content>
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
