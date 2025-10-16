'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button } from '@/app/components/ui';
import { NETATMO_ROUTES } from '@/lib/routes';

export default function NetatmoTemperatureReport() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

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
      const enrichedRooms = (data.rooms || []).map(room => {
        const topologyRoom = topologyData.rooms?.find(r => r.id === room.room_id);
        const modules = topologyData.modules?.filter(m =>
          topologyRoom?.modules?.includes(m.id)
        ) || [];

        // Filter out relay modules (NAPlug)
        const filteredModules = modules.filter(m => m.type !== 'NAPlug');

        // Determine device type priority
        const hasThermostat = filteredModules.some(m => m.type === 'NATherm1' || m.type === 'OTH');
        const hasValve = filteredModules.some(m => m.type === 'NRV');

        return {
          ...room,
          modules: filteredModules,
          deviceType: hasThermostat ? 'thermostat' : hasValve ? 'valve' : 'unknown',
        };
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
  const getRoomIcon = (roomType) => {
    const icons = {
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
  const getTempColor = (temp, setpoint) => {
    if (!temp || !setpoint) return 'text-neutral-600';
    const diff = temp - setpoint;
    if (diff >= 0.5) return 'text-success-600';
    if (diff <= -1) return 'text-primary-600';
    return 'text-warning-600';
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">🌡️</span>
          <div>
            <h3 className="text-lg font-bold text-neutral-900">Netatmo Temperature</h3>
            <p className="text-xs text-neutral-500">Caricamento...</p>
          </div>
        </div>
        <div className="animate-pulse space-y-3">
          <div className="h-12 bg-neutral-200 rounded-xl"></div>
          <div className="h-12 bg-neutral-200 rounded-xl"></div>
          <div className="h-12 bg-neutral-200 rounded-xl"></div>
        </div>
      </Card>
    );
  }

  if (!connected) {
    return (
      <Card className="p-6 bg-info-50 border-2 border-info-200">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">🌡️</span>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-neutral-900">Netatmo Temperature</h3>
            <p className="text-xs text-neutral-500">Non connesso • Connetti per visualizzare le temperature</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            variant="info"
            onClick={() => router.push('/netatmo')}
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
            <h3 className="text-lg font-bold text-neutral-900">Netatmo Temperature</h3>
            <p className="text-xs text-neutral-500">
              {sortedRooms.length} {sortedRooms.length === 1 ? 'stanza' : 'stanze'}
              {lastUpdate && (
                <span className="text-neutral-400 ml-2">
                  • Aggiornato {Math.floor((Date.now() - lastUpdate) / 1000)}s fa
                </span>
              )}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/netatmo')}
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
              className="flex items-center gap-3 p-3 bg-white/60 backdrop-blur-sm rounded-xl border border-neutral-200 hover:shadow-md transition-shadow duration-200"
            >
              {/* Room icon */}
              <span className="text-2xl flex-shrink-0">
                {getRoomIcon(room.room_type)}
              </span>

              {/* Room info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-semibold text-neutral-900 truncate">
                    {room.room_name}
                  </p>
                  {/* Device type badge */}
                  {room.deviceType === 'thermostat' && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-info-100 text-info-700 flex-shrink-0" title="Termostato">
                      🌡️
                    </span>
                  )}
                  {room.deviceType === 'valve' && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-accent-100 text-accent-700 flex-shrink-0" title="Valvola">
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
                      <span className="text-xs text-neutral-400">/</span>
                      <span className="text-sm font-medium text-neutral-500">
                        {room.setpoint?.toFixed(1)}°
                      </span>
                    </>
                  ) : room.setpoint !== undefined ? (
                    <>
                      <span className="text-sm text-neutral-400">--°</span>
                      <span className="text-xs text-neutral-400">/</span>
                      <span className="text-sm font-medium text-neutral-500">
                        {room.setpoint.toFixed(1)}°
                      </span>
                    </>
                  ) : (
                    <span className="text-xs text-neutral-400 italic">N/D</span>
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
        <div className="p-8 text-center bg-neutral-50 rounded-xl border-2 border-dashed border-neutral-300">
          <p className="text-sm text-neutral-500">
            Nessuna stanza configurata
          </p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mt-4 p-3 bg-warning-50 border border-warning-200 rounded-xl">
          <p className="text-sm text-warning-700">⚠️ {error}</p>
        </div>
      )}
    </Card>
  );
}
