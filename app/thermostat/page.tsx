'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, Button, Skeleton, ErrorAlert, Banner, Heading, Text, Grid, InfoBox, PageLayout } from '@/app/components/ui';
import RoomCard from '@/app/components/netatmo/RoomCard';
import BatteryWarning, { ModuleBatteryList } from '@/app/components/devices/thermostat/BatteryWarning';
import StoveSyncPanel from '@/app/components/netatmo/StoveSyncPanel';
import ThermostatTabs from './components/ThermostatTabs';
import { NETATMO_ROUTES } from '@/lib/routes';
import { Calendar, Clock } from 'lucide-react';

interface NetatmoTopology {
  home_id: string;
  home_name: string;
  rooms?: NetatmoRoom[];
  modules?: NetatmoModule[];
  [key: string]: unknown;
}

interface NetatmoRoom {
  id: string;
  name?: string;
  modules?: string[];
  [key: string]: unknown;
}

interface NetatmoModule {
  id: string;
  type: string;
  battery_state?: string;
  battery_level?: number;
  reachable?: boolean;
  rf_strength?: number;
  [key: string]: unknown;
}

interface NetatmoStatus {
  mode?: string;
  rooms?: RoomStatus[];
  modules?: ModuleStatus[];
  hasLowBattery?: boolean;
  hasCriticalBattery?: boolean;
  lowBatteryModules?: NetatmoModule[];
  [key: string]: unknown;
}

interface RoomStatus {
  room_id: string;
  temperature?: number;
  setpoint?: number;
  mode?: string;
  heating?: boolean;
  stoveSync?: boolean;
  stoveSyncSetpoint?: number;
  [key: string]: unknown;
}

interface ModuleStatus {
  id: string;
  battery_state?: string;
  battery_level?: number;
  reachable?: boolean;
  rf_strength?: number;
  [key: string]: unknown;
}

interface RoomWithStatus extends NetatmoRoom {
  name: string;
  type: string;
  temperature?: number;
  setpoint?: number;
  mode?: string;
  heating?: boolean;
  stoveSync?: boolean;
  stoveSyncSetpoint?: number;
  roomModules?: NetatmoModule[];
  deviceType: 'thermostat' | 'valve' | 'unknown';
  hasLowBattery?: boolean;
  hasCriticalBattery?: boolean;
  isOffline?: boolean;
}

function NetatmoContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const [topology, setTopology] = useState<NetatmoTopology | null>(null);
  const [status, setStatus] = useState<NetatmoStatus | null>(null);
  const [mode, setMode] = useState<string>('schedule');
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [oauthError, setOauthError] = useState<string | null>(null);

  // Flags per prevenire double fetch in React Strict Mode
  const connectionCheckedRef = useRef(false);
  const pollingStartedRef = useRef(false);

  // Check for OAuth callback errors in URL
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setOauthError(decodeURIComponent(errorParam));
      // Clear error from URL without reload
      window.history.replaceState({}, '', '/thermostat');
    }
  }, [searchParams]);

  // Check connection status on mount
  useEffect(() => {
    // Skip se già controllato (React 18 Strict Mode double mount)
    if (connectionCheckedRef.current) return;
    connectionCheckedRef.current = true;

    checkConnection();
  }, []);

  // Fetch topology if connected
  useEffect(() => {
    if (connected) {
      fetchTopology();
    }
  }, [connected]);

  // Poll status every 30 seconds
  useEffect(() => {
    if (!topology) return;

    // Previeni double execution in React Strict Mode
    if (pollingStartedRef.current) return;
    pollingStartedRef.current = true;

    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);

    return () => {
      clearInterval(interval);
      // Reset ref on unmount per permettere re-mount
      pollingStartedRef.current = false;
    };
  }, [topology]);

  // Redirect to /netatmo if not connected (must be in useEffect to avoid setState-in-render)
  useEffect(() => {
    if (!loading && !connected) {
      router.replace('/netatmo');
    }
  }, [loading, connected, router]);

  async function checkConnection() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(NETATMO_ROUTES.homesData);
      const data = await response.json();

      // ✅ Handle reconnect flag from token helper
      if (data.reconnect) {
        setConnected(false);
        setError(data.error);
        return;
      }

      // If we get data without error, we're connected
      if (!data.error && data.home_id) {
        setConnected(true);
        setTopology(data as NetatmoTopology);
      } else if (data.error && (data.error.includes('refresh token') || data.error.includes('Nessun refresh token'))) {
        // Not connected - show auth card
        setConnected(false);
      } else {
        // Other error - still connected but something else failed
        console.error('❌ Netatmo: API error -', data.error);
        setConnected(true);
        throw new Error(data.error);
      }
    } catch (err) {
      console.error('❌ Netatmo: Exception in checkConnection -', err);
      // If fetch fails, check if it's auth error
      const message = err instanceof Error ? err.message : 'Unknown error';
      if (message.includes('refresh token') || message.includes('Nessun refresh token')) {
        setConnected(false);
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }

  async function fetchTopology(): Promise<void> {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(NETATMO_ROUTES.homesData);
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setTopology(data as NetatmoTopology);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchStatus(): Promise<void> {
    try {
      setError(null);

      const response = await fetch(NETATMO_ROUTES.homeStatus);
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setStatus(data as NetatmoStatus);
      setMode(data.mode || 'schedule');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
    }
  }

  async function handleModeChange(newMode: string): Promise<void> {
    try {
      setError(null);

      const response = await fetch(NETATMO_ROUTES.setThermMode, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: newMode }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setMode(newMode);
      await fetchStatus();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
    }
  }

  async function handleRefresh(): Promise<void> {
    setRefreshing(true);
    await fetchTopology();
    await fetchStatus();
    setRefreshing(false);
  }

  if (loading) {
    return <Skeleton.NetatmoPage />;
  }

  // Show skeleton while redirecting (redirect happens in useEffect above)
  if (!connected) {
    return <Skeleton.NetatmoPage />;
  }

  // Show error if topology failed to load
  if (!topology && error) {
    return (
      <PageLayout maxWidth="7xl">
        <Card variant="elevated" className="p-6 sm:p-8">
          <Heading level={2} size="2xl" className="mb-4">
            Errore Connessione Netatmo
          </Heading>

          <Banner variant="error">{error}</Banner>

          {/* Helpful troubleshooting info */}
          <Banner variant="info" icon="💡" title="Suggerimenti:" className="mt-6">
            <ul className="space-y-1 ml-1 mt-2">
              <Text as="li" size="sm">Verifica di aver completato l&apos;autenticazione Netatmo</Text>
              <Text as="li" size="sm">Controlla che il tuo account Netatmo sia attivo</Text>
              <Text as="li" size="sm">Assicurati di avere almeno un termostato configurato</Text>
              <Text as="li" size="sm">Se il problema persiste, prova a disconnettere e riconnettere</Text>
            </ul>
          </Banner>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button variant="ember" onClick={checkConnection}>
              🔄 Riprova
            </Button>
            <Button
              variant="subtle"
              onClick={async () => {
                // ✅ Clear token from Firebase before reconnecting
                await fetch(NETATMO_ROUTES.disconnect, { method: 'POST' });
                setConnected(false);
                setError(null);
                setTopology(null);
              }}
            >
              🔗 Riconnetti Account
            </Button>
          </div>
        </Card>
      </PageLayout>
    );
  }

  if (!topology) {
    return <Skeleton.NetatmoPage />;
  }

  const rooms = topology.rooms || [];
  const topologyModules = topology.modules || [];

  // Get modules with battery status from status endpoint
  const statusModules = status?.modules || [];

  // Merge topology modules with status modules to get battery info
  const modulesWithBattery = topologyModules.map(topModule => {
    const statusModule = statusModules.find(m => m.id === topModule.id);
    return {
      ...topModule,
      // Add battery/status info from statusModules
      battery_state: statusModule?.battery_state,
      battery_level: statusModule?.battery_level,
      reachable: statusModule?.reachable ?? true, // Default to true if not in status
      rf_strength: statusModule?.rf_strength,
    };
  });

  // Map rooms with status and enrich with module info
  // Shows ALL rooms from topology, even if offline
  const roomsWithStatus: RoomWithStatus[] = rooms.map(room => {
    const roomStatus = status?.rooms?.find(r => r.room_id === room.id);

    // Find modules for this room (exclude relays - NAPlug and cameras - NACamera, NOC), with battery info
    const roomModules = room.modules?.map(moduleId => {
      return modulesWithBattery.find(m => m.id === moduleId);
    }).filter(Boolean).filter(m => m!.type !== 'NAPlug' && m!.type !== 'NACamera' && m!.type !== 'NOC') as NetatmoModule[] || [];

    // Determine device type
    const hasThermostat = roomModules.some(m => m.type === 'NATherm1' || m.type === 'OTH');
    const hasValve = roomModules.some(m => m.type === 'NRV');

    // Check if any module has battery issues
    const hasLowBattery = roomModules.some(m =>
      m.battery_state === 'low' || m.battery_state === 'very_low'
    );
    const hasCriticalBattery = roomModules.some(m => m.battery_state === 'very_low');

    // Check if room is offline (no reachable modules)
    const isOffline = roomModules.length > 0 && roomModules.every(m => m.reachable === false);

    const deviceType: 'thermostat' | 'valve' | 'unknown' = hasThermostat ? 'thermostat' : hasValve ? 'valve' : 'unknown';

    return {
      ...room,
      name: room.name || 'Stanza',
      type: 'custom',
      temperature: roomStatus?.temperature,
      setpoint: roomStatus?.setpoint,
      mode: roomStatus?.mode,
      heating: roomStatus?.heating,
      stoveSync: roomStatus?.stoveSync || false,
      stoveSyncSetpoint: roomStatus?.stoveSyncSetpoint,
      roomModules, // Add module details with battery info
      deviceType,
      hasLowBattery,
      hasCriticalBattery,
      isOffline,
    };
  }).filter(room => {
    // Only show rooms that have at least one thermostat or valve device
    // Exclude rooms with only cameras or no thermostat/valve modules
    return room.deviceType === 'thermostat' || room.deviceType === 'valve';
  });

  // Count only thermostat/valve modules (exclude cameras and relays)
  const filteredModulesCount = modulesWithBattery.filter(m =>
    m.type !== 'NAPlug' && m.type !== 'NACamera' && m.type !== 'NOC'
  ).length;

  // Sort rooms: thermostats first, then valves, then by temperature availability
  const sortedRooms = roomsWithStatus.sort((a, b) => {
    // Priority 1: Thermostats first
    if (a.deviceType === 'thermostat' && b.deviceType !== 'thermostat') return -1;
    if (a.deviceType !== 'thermostat' && b.deviceType === 'thermostat') return 1;

    // Priority 2: Valves before unknown
    if (a.deviceType === 'valve' && b.deviceType === 'unknown') return -1;
    if (a.deviceType === 'unknown' && b.deviceType === 'valve') return 1;

    // Priority 3: Rooms with temperature first
    const aHasTemp = a.temperature !== undefined;
    const bHasTemp = b.temperature !== undefined;
    if (aHasTemp && !bHasTemp) return -1;
    if (!aHasTemp && bHasTemp) return 1;

    return 0;
  });

  // Mode button configuration - using colorScheme prop for declarative tinting
  const modeConfig = {
    schedule: {
      label: 'Programmato',
      icon: '\u23F0',
      colorScheme: 'sage' as const,
    },
    away: {
      label: 'Assenza',
      icon: '\uD83C\uDFC3',
      colorScheme: 'warning' as const,
    },
    hg: {
      label: 'Antigelo',
      icon: '\u2744\uFE0F',
      colorScheme: 'ocean' as const,
    },
    off: {
      label: 'Off',
      icon: '\u23F8\uFE0F',
      colorScheme: 'slate' as const,
    },
  };

  return (
    <PageLayout
      maxWidth="7xl"
      header={
        <PageLayout.Header
          title="Controllo Netatmo"
          description="Gestisci temperature e riscaldamento di tutte le stanze"
        />
      }
    >
      {/* Error Alert - above tabs */}
      {error && (
        <div className="mb-6">
          <Banner variant="error">{error}</Banner>
        </div>
      )}

      {/* Battery Warning Banner - above tabs */}
      {(status?.hasLowBattery || status?.hasCriticalBattery) && (
        <div className="mb-6">
          <BatteryWarning
            lowBatteryModules={(status?.lowBatteryModules || []) as any}
            hasCriticalBattery={status?.hasCriticalBattery || false}
          />
        </div>
      )}

      <ThermostatTabs
        defaultValue="schedule"
        scheduleContent={
          <>
            {/* Mode Control - Liquid Glass Card */}
            <Card variant="glass" className="p-5 sm:p-6 mb-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <Heading level={2} size="xl" className="mb-1">
                    Modalita Riscaldamento
                  </Heading>
                  <Text variant="tertiary" size="sm">
                    {mode === 'schedule' && 'Programmazione attiva'}
                    {mode === 'away' && 'Modalita assenza'}
                    {mode === 'hg' && 'Antigelo'}
                    {mode === 'off' && 'Spento'}
                  </Text>
                </div>

                <div className="flex flex-wrap gap-2">
                  {['schedule', 'away', 'hg', 'off'].map((targetMode) => {
                    const config = modeConfig[targetMode as keyof typeof modeConfig];
                    const isActive = mode === targetMode;
                    return (
                      <Button
                        key={targetMode}
                        variant={isActive ? 'subtle' : 'ghost'}
                        colorScheme={config.colorScheme}
                        onClick={() => handleModeChange(targetMode)}
                        size="sm"
                      >
                        <span>{config.icon}</span>
                        <span>{config.label}</span>
                      </Button>
                    );
                  })}
                </div>
              </div>
            </Card>

            {/* Schedule Management Link */}
            <Card variant="glass" className="p-5 sm:p-6 mb-6">
              <Link
                href="/thermostat/schedule"
                className="flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="
                    w-10 h-10 rounded-xl
                    bg-ember-500/20 flex items-center justify-center
                    group-hover:bg-ember-500/30 transition-colors
                  ">
                    <Calendar className="text-ember-400" size={20} />
                  </div>
                  <div>
                    <Heading level={3} size="lg">
                      Programmazione
                    </Heading>
                    <Text variant="secondary" size="sm">
                      Visualizza e gestisci le programmazioni settimanali
                    </Text>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="group-hover:text-ember-400">
                  Apri
                </Button>
              </Link>
            </Card>

            {/* Topology Info - Liquid Glass Card */}
            <Card variant="glass" className="p-5 sm:p-6">
              <Grid cols={3} gap="sm" className="md:grid-cols-3">
                <InfoBox
                  icon="🏠"
                  label="Casa"
                  value={topology.home_name}
                  variant="neutral"
                />
                <InfoBox
                  icon="🚪"
                  label="Stanze"
                  value={roomsWithStatus.length}
                  variant="neutral"
                />
                <InfoBox
                  icon="📡"
                  label="Moduli"
                  value={filteredModulesCount}
                  variant="neutral"
                />
              </Grid>

              {/* Module Battery Status List */}
              {modulesWithBattery && modulesWithBattery.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-700/50 [html:not(.dark)_&]:border-slate-200">
                  <ModuleBatteryList modules={modulesWithBattery as any} />
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-slate-700/50 [html:not(.dark)_&]:border-slate-200">
                <Button
                  variant="subtle"
                  onClick={handleRefresh}
                  loading={refreshing}
                  size="sm"
                >
                  Aggiorna Configurazione
                </Button>
              </div>
            </Card>
          </>
        }
        manualContent={
          <>
            {/* Stove Sync Panel */}
            <div className="mb-6">
              <StoveSyncPanel onSyncComplete={fetchStatus} />
            </div>

            {/* Rooms Grid */}
            <Grid cols={3} gap="md">
              {sortedRooms.map(room => (
                <RoomCard
                  key={room.id}
                  room={room as any}
                  onRefresh={fetchStatus}
                />
              ))}
            </Grid>

            {/* Empty State */}
            {rooms.length === 0 && (
              <Card variant="default" className="p-12 text-center">
                <Text variant="tertiary">
                  Nessuna stanza configurata. Aggiungi dispositivi Netatmo tramite l&apos;app ufficiale.
                </Text>
              </Card>
            )}
          </>
        }
        historyContent={
          <Card variant="glass" className="p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <Clock className="w-12 h-12 text-slate-400" />
              <Heading level={3} size="lg">
                Storico Temperature
              </Heading>
              <Text variant="secondary">
                Lo storico delle temperature sara disponibile in un prossimo aggiornamento.
              </Text>
            </div>
          </Card>
        }
      />
    </PageLayout>
  );
}

// ✅ Wrap with Suspense for useSearchParams
export default function NetatmoPage() {
  return (
    <Suspense fallback={<Skeleton.NetatmoPage />}>
      <NetatmoContent />
    </Suspense>
  );
}
