'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Heading, Text } from '@/app/components/ui';
import { NETATMO_ROUTES } from '@/lib/routes';

interface RoomData {
  room_id: string;
  room_name: string;
  room_type: string;
  temperature?: number;
  setpoint?: number;
  heating?: boolean;
  deviceType: 'thermostat' | 'valve' | 'unknown';
  modules?: Array<{
    id: string;
    type: string;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}

export default function NetatmoTemperatureReport() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);

  // Flag per prevenire double fetch in React Strict Mode
  const pollingStartedRef = useRef(false);

  const fetchTemperatures = async () => {
    try {
      // Fetch homestatus
      const response = await fetch(NETATMO_ROUTES.homeStatus);
      const data = await response.json();

      if (data.reconnect || data.error) {
        setConnected(false);
        setError(data.error || 'Non connesso');
        setRooms([]);
        return;
      }

      // Fetch topology to get module info
      const topologyResponse = await fetch(NETATMO_ROUTES.homesData);
      const topologyData = await topologyResponse.json();

      // Enrich rooms with module information
      const enrichedRooms = (data.rooms || []).map((room: any) => {
        const topologyRoom = topologyData.rooms?.find((r: any) => r.id === room.room_id);
        const modules = topologyData.modules?.filter((m: any) =>
          topologyRoom?.modules?.includes(m.id)
        ) || [];

        // Filter out relay modules (NAPlug) and cameras (NACamera, NOC)
        const filteredModules = modules.filter((m: any) =>
          m.type !== 'NAPlug' && m.type !== 'NACamera' && m.type !== 'NOC'
        );

        // Determine device type priority
        const hasThermostat = filteredModules.some((m: any) => m.type === 'NATherm1' || m.type === 'OTH');
        const hasValve = filteredModules.some((m: any) => m.type === 'NRV');

        return {
          ...room,
          modules: filteredModules,
          deviceType: hasThermostat ? 'thermostat' : hasValve ? 'valve' : 'unknown',
        };
      }).filter((room: RoomData) => {
        // Only include rooms with thermostat or valve devices
        return room.deviceType === 'thermostat' || room.deviceType === 'valve';
      });

      setConnected(true);
      setRooms(enrichedRooms);
      setLastUpdate(Date.now());
      setError(null);
    } catch (err) {
      console.error('Error fetching Netatmo temperatures:', err);
      setConnected(false);
      setError('Errore di connessione');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Previeni double execution in React Strict Mode
    if (pollingStartedRef.current) return;
    pollingStartedRef.current = true;

    fetchTemperatures();
    const interval = setInterval(fetchTemperatures, 30000); // Poll ogni 30s

    return () => {
      clearInterval(interval);
      pollingStartedRef.current = false;
    };
  }, []);

  // Get room type icon
  const getRoomIcon = (roomType: string): string => {
    const icons: Record<string, string> = {
      livingroom: '🛋️',
      bedroom: '🛏️',
      kitchen: '🍳',
      bathroom: '🚿',
      office: '💼',
      corridor: '🚪',
    };
    return icons[roomType] || '🏠';
  };

  // Get temperature color
  const getTempColor = (temp?: number, setpoint?: number): string => {
    if (!temp || !setpoint) return 'text-slate-400 [html:not(.dark)_&]:text-slate-600';
    const diff = temp - setpoint;
    if (diff >= 0.5) return 'text-sage-400 [html:not(.dark)_&]:text-sage-600';
    if (diff <= -1) return 'text-ember-400 [html:not(.dark)_&]:text-ember-600';
    return 'text-warning-400 [html:not(.dark)_&]:text-warning-600';
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">🌡️</span>
          <div>
            <Heading level={3} size="lg">Netatmo Temperature</Heading>
            <Text variant="tertiary" size="xs">Caricamento...</Text>
          </div>
        </div>
        <div className="animate-pulse space-y-3">
          <div className="h-12 bg-slate-700/50 [html:not(.dark)_&]:bg-slate-200 rounded-xl"></div>
          <div className="h-12 bg-slate-700/50 [html:not(.dark)_&]:bg-slate-200 rounded-xl"></div>
          <div className="h-12 bg-slate-700/50 [html:not(.dark)_&]:bg-slate-200 rounded-xl"></div>
        </div>
      </Card>
    );
  }

  if (!connected) {
    return (
      <Card className="p-6 bg-ocean-900/20 [html:not(.dark)_&]:bg-ocean-50 border-2 border-ocean-700 [html:not(.dark)_&]:border-ocean-200">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">🌡️</span>
          <div className="flex-1">
            <Heading level={3} size="lg">Netatmo Temperature</Heading>
            <Text variant="tertiary" size="xs">Non connesso • Connetti per visualizzare le temperature</Text>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            variant="subtle"
            onClick={() => router.push('/thermostat')}
            className="flex-1"
          >
            🔗 Connetti Netatmo
          </Button>
        </div>
      </Card>
    );
  }

  // Sort rooms: thermostats first, then valves, then by temperature availability
  const sortedRooms = [...rooms].sort((a, b) => {
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

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🌡️</span>
          <div>
            <Heading level={3} size="lg">Netatmo Temperature</Heading>
            <Text variant="tertiary" size="xs">
              {sortedRooms.length} {sortedRooms.length === 1 ? 'stanza' : 'stanze'}
              {lastUpdate && (
                <Text variant="tertiary" size="xs" as="span" className="ml-2">
                  • Aggiornato {Math.floor((Date.now() - lastUpdate) / 1000)}s fa
                </Text>
              )}
            </Text>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/thermostat')}
        >
          Dettagli →
        </Button>
      </div>

      {/* Temperature Grid - Compatto */}
      {sortedRooms.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {sortedRooms.map(room => (
            <div
              key={room.room_id}
              className="flex items-center gap-3 p-3 bg-slate-800/60 [html:not(.dark)_&]:bg-white/60 backdrop-blur-sm rounded-xl border border-slate-700 [html:not(.dark)_&]:border-slate-200 hover:shadow-md transition-shadow duration-200"
            >
              {/* Room icon */}
              <span className="text-2xl flex-shrink-0">
                {getRoomIcon(room.room_type)}
              </span>

              {/* Room info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <Text variant="body" size="sm" weight="semibold" className="truncate">
                    {room.room_name}
                  </Text>
                  {/* Device type badge */}
                  {room.deviceType === 'thermostat' && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-ocean-900/40 [html:not(.dark)_&]:bg-ocean-100 text-ocean-300 [html:not(.dark)_&]:text-ocean-700 flex-shrink-0" title="Termostato">
                      🌡️
                    </span>
                  )}
                  {room.deviceType === 'valve' && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-flame-900/40 [html:not(.dark)_&]:bg-flame-100 text-flame-300 [html:not(.dark)_&]:text-flame-700 flex-shrink-0" title="Valvola">
                      🔧
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  {room.temperature !== undefined ? (
                    <>
                      <span className={`text-lg font-bold ${getTempColor(room.temperature, room.setpoint)}`}>
                        {room.temperature.toFixed(1)}°
                      </span>
                      <Text variant="tertiary" size="xs" as="span">/</Text>
                      <Text variant="tertiary" size="sm" weight="medium" as="span">
                        {room.setpoint?.toFixed(1)}°
                      </Text>
                    </>
                  ) : room.setpoint !== undefined ? (
                    <>
                      <Text variant="tertiary" size="sm" as="span">--°</Text>
                      <Text variant="tertiary" size="xs" as="span">/</Text>
                      <Text variant="tertiary" size="sm" weight="medium" as="span">
                        {room.setpoint.toFixed(1)}°
                      </Text>
                    </>
                  ) : (
                    <Text variant="tertiary" size="xs" as="span" className="italic">N/D</Text>
                  )}
                </div>
              </div>

              {/* Heating indicator */}
              {room.heating && (
                <span className="text-lg flex-shrink-0" title="Riscaldamento attivo">
                  🔥
                </span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="p-8 text-center bg-slate-800/60 [html:not(.dark)_&]:bg-slate-50 rounded-xl border-2 border-dashed border-slate-600 [html:not(.dark)_&]:border-slate-300">
          <Text variant="tertiary" size="sm">
            Nessuna stanza configurata
          </Text>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mt-4 p-3 bg-warning-900/20 [html:not(.dark)_&]:bg-warning-50 border border-warning-700 [html:not(.dark)_&]:border-warning-200 rounded-xl">
          <Text variant="warning" size="sm">⚠️ {error}</Text>
        </div>
      )}
    </Card>
  );
}
