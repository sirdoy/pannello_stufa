'use client';

/**
 * Unified Settings Page
 *
 * Consolidates 4 settings pages into a single tabbed interface:
 * - Theme (Aspetto)
 * - Location (Posizione)
 * - Dashboard (Personalizza home)
 * - Devices (Gestione Dispositivi)
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
import Switch from '@/app/components/ui/Switch';
import Toggle from '@/app/components/ui/Toggle';
import Banner from '@/app/components/ui/Banner';
import Badge from '@/app/components/ui/Badge';
import Skeleton from '@/app/components/ui/Skeleton';
import { Heading, Text } from '@/app/components/ui';
import LocationSearch from '@/app/components/LocationSearch';
import { Palette, MapPin, LayoutGrid, Smartphone, ChevronUp, ChevronDown } from 'lucide-react';

/**
 * ThemeContent - Extracted from theme/page.js
 */
function ThemeContent() {
  const { theme, setTheme, isLoading: themeLoading } = useTheme();
  const [isSaving, setIsSaving] = useState(false);

  const handleThemeChange = async (newTheme) => {
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
                <Text variant="body" weight="semibold" as="div">
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
                <Text variant="body" weight="semibold" as="div">
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
            <Text variant="body" weight="medium" className="mb-2">
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
              <Text variant="ember" weight="semibold">Rosso</Text>
            </div>
            <div className="p-3 bg-ocean-50 [html:not(.dark)_&]:bg-ocean-50 bg-ocean-900/20 rounded-lg">
              <Text variant="tertiary" size="xs" className="mb-1">Info</Text>
              <Text variant="ocean" weight="semibold">Blu</Text>
            </div>
            <div className="p-3 bg-sage-50 [html:not(.dark)_&]:bg-sage-50 bg-sage-900/20 rounded-lg">
              <Text variant="tertiary" size="xs" className="mb-1">Success</Text>
              <Text variant="sage" weight="semibold">Verde</Text>
            </div>
            <div className="p-3 bg-warning-50 [html:not(.dark)_&]:bg-warning-50 bg-warning-900/20 rounded-lg">
              <Text variant="tertiary" size="xs" className="mb-1">Warning</Text>
              <Text variant="warning" weight="semibold">Arancione</Text>
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
function LocationContent() {
  const { user } = useUser();
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);

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
  const handleLocationSelected = async (location) => {
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

/**
 * DashboardContent - Extracted from dashboard/page.js
 */
function DashboardContent() {
  const { user } = useUser();
  const [cards, setCards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);

  // Fetch current preferences on mount
  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const response = await fetch('/api/config/dashboard');
        if (response.ok) {
          const data = await response.json();
          setCards(data.preferences.cardOrder || []);
        }
      } catch (err) {
        console.error('Error fetching dashboard preferences:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchPreferences();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  // Move card up in the list
  const moveUp = (index) => {
    if (index === 0) return;
    setCards((prev) => {
      const newCards = [...prev];
      [newCards[index - 1], newCards[index]] = [
        newCards[index],
        newCards[index - 1],
      ];
      return newCards;
    });
  };

  // Move card down in the list
  const moveDown = (index) => {
    if (index === cards.length - 1) return;
    setCards((prev) => {
      const newCards = [...prev];
      [newCards[index], newCards[index + 1]] = [
        newCards[index + 1],
        newCards[index],
      ];
      return newCards;
    });
  };

  // Toggle card visibility
  const toggleVisibility = (index, newVisible) => {
    setCards((prev) =>
      prev.map((card, i) =>
        i === index ? { ...card, visible: newVisible } : card
      )
    );
  };

  // Save preferences to server
  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const response = await fetch('/api/config/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardOrder: cards }),
      });

      if (response.ok) {
        setSaveMessage({ type: 'success', text: 'Preferenze salvate!' });
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
      {/* Card list */}
      <div className="space-y-3">
        {cards.map((card, index) => (
          <Card
            key={card.id}
            variant="glass"
            padding={false}
            className={`p-4 ${card.visible ? '' : 'opacity-60'}`}
          >
            <div className="flex items-center justify-between">
              {/* Left: Icon + Label + Badge */}
              <div className="flex items-center gap-3">
                <span className="text-2xl">{card.icon}</span>
                <div className="flex items-center gap-2">
                  <Text className="font-medium">{card.label}</Text>
                  {!card.visible && (
                    <Badge variant="neutral" size="sm">
                      Nascosto
                    </Badge>
                  )}
                </div>
              </div>

              {/* Right: Switch + Up/Down buttons */}
              <div className="flex items-center gap-4">
                <Switch
                  checked={card.visible}
                  onCheckedChange={(checked) => toggleVisibility(index, checked)}
                  variant="ember"
                  size="sm"
                  label={`Mostra ${card.label}`}
                />
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    iconOnly
                    disabled={index === 0}
                    onClick={() => moveUp(index)}
                    aria-label={`Sposta ${card.label} su`}
                  >
                    <ChevronUp size={20} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    iconOnly
                    disabled={index === cards.length - 1}
                    onClick={() => moveDown(index)}
                    aria-label={`Sposta ${card.label} giù`}
                  >
                    <ChevronDown size={20} />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Save section */}
      <div className="flex justify-end mt-6">
        <Button
          variant="ember"
          onClick={handleSave}
          loading={isSaving}
          disabled={isSaving}
        >
          Salva
        </Button>
      </div>

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
    </div>
  );
}

/**
 * DevicesContent - Extracted from devices/page.js
 */
function DevicesContent() {
  const { user } = useUser();
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

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <div className="space-y-6 mt-6">
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
          {devices.map(device => {
            const isEnabled = preferences[device.id] === true;

            return (
              <div
                key={device.id}
                className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                  isEnabled
                    ? 'border-ember-600 [html:not(.dark)_&]:border-ember-400 bg-ember-950/30 [html:not(.dark)_&]:bg-ember-50/50'
                    : 'border-slate-600 [html:not(.dark)_&]:border-slate-300 bg-white/[0.02] [html:not(.dark)_&]:bg-slate-50/50'
                }`}
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
          <Tabs.Trigger value="dashboard" icon={<LayoutGrid size={18} />}>Dashboard</Tabs.Trigger>
          <Tabs.Trigger value="dispositivi" icon={<Smartphone size={18} />}>Dispositivi</Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="aspetto"><ThemeContent /></Tabs.Content>
        <Tabs.Content value="posizione"><LocationContent /></Tabs.Content>
        <Tabs.Content value="dashboard"><DashboardContent /></Tabs.Content>
        <Tabs.Content value="dispositivi"><DevicesContent /></Tabs.Content>
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
