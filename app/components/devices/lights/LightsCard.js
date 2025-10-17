'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import Select from '../../ui/Select';
import Banner from '../../ui/Banner';

/**
 * LightsCard - Complete Philips Hue lights control for homepage
 * Summary view with quick room controls
 */
export default function LightsCard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [lights, setLights] = useState([]);
  const [scenes, setScenes] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const connectionCheckedRef = useRef(false);
  const pollingStartedRef = useRef(false);

  // Check connection on mount
  useEffect(() => {
    if (connectionCheckedRef.current) return;
    connectionCheckedRef.current = true;
    checkConnection();
  }, []);

  // Poll data every 30 seconds if connected
  useEffect(() => {
    if (!connected) return;
    if (pollingStartedRef.current) return;
    pollingStartedRef.current = true;

    fetchData();
    const interval = setInterval(fetchData, 30000);

    return () => {
      clearInterval(interval);
      pollingStartedRef.current = false;
    };
  }, [connected]);

  // Auto-select first room
  useEffect(() => {
    if (rooms.length > 0 && !selectedRoomId) {
      setSelectedRoomId(rooms[0].id);
    }
  }, [rooms, selectedRoomId]);

  const selectedRoom = rooms.find(r => r.id === selectedRoomId) || rooms[0];
  const roomLights = lights.filter(light =>
    selectedRoom?.services?.some(s => s.rid === light.id)
  );
  const roomScenes = scenes.filter(scene =>
    scene.group?.rid === selectedRoom?.id
  );

  async function checkConnection() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/hue/status');
      const data = await response.json();

      if (data.connected) {
        setConnected(true);
      } else {
        setConnected(false);
      }
    } catch (err) {
      console.error('Errore connessione Hue:', err);
      setConnected(false);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchData() {
    try {
      setError(null);

      const [roomsRes, lightsRes, scenesRes] = await Promise.all([
        fetch('/api/hue/rooms'),
        fetch('/api/hue/lights'),
        fetch('/api/hue/scenes'),
      ]);

      const [roomsData, lightsData, scenesData] = await Promise.all([
        roomsRes.json(),
        lightsRes.json(),
        scenesRes.json(),
      ]);

      if (roomsData.reconnect || lightsData.reconnect || scenesData.reconnect) {
        setConnected(false);
        return;
      }

      if (roomsData.error) throw new Error(roomsData.error);
      if (lightsData.error) throw new Error(lightsData.error);
      if (scenesData.error) throw new Error(scenesData.error);

      console.log('🔍 Client - Rooms received:', roomsData.rooms?.length || 0, roomsData.rooms);
      console.log('🔍 Client - Lights received:', lightsData.lights?.length || 0);
      console.log('🔍 Client - Scenes received:', scenesData.scenes?.length || 0);

      setRooms(roomsData.rooms || []);
      setLights(lightsData.lights || []);
      setScenes(scenesData.scenes || []);
    } catch (err) {
      console.error('Errore fetch dati Hue:', err);
      setError(err.message);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await checkConnection();
    if (connected) await fetchData();
    setRefreshing(false);
  }

  async function handleRoomToggle(roomId, on) {
    try {
      setError(null);
      const response = await fetch(`/api/hue/rooms/${roomId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ on: { on } }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);
      await fetchData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleBrightnessChange(roomId, brightness) {
    try {
      setError(null);
      const response = await fetch(`/api/hue/rooms/${roomId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dimming: { brightness: parseFloat(brightness) }
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);
      await fetchData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSceneActivate(sceneId) {
    try {
      setError(null);
      const response = await fetch(`/api/hue/scenes/${sceneId}/activate`, {
        method: 'PUT',
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);
      await fetchData();
    } catch (err) {
      setError(err.message);
    }
  }

  const handleAuth = () => {
    const clientId = process.env.NEXT_PUBLIC_HUE_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_HUE_REDIRECT_URI;
    const state = Math.random().toString(36).substring(7);
    // Scope completo: tutti i permessi disponibili
    const scope = 'lights scenes groups devices bridge';
    window.location.href = `https://api.meethue.com/v2/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&state=${state}&scope=${encodeURIComponent(scope)}`;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Card className="p-4 sm:p-6 lg:p-8">
          <div className="space-y-4">
            <div className="h-6 bg-neutral-200 rounded animate-pulse w-1/3" />
            <div className="h-4 bg-neutral-200 rounded animate-pulse w-2/3" />
            <div className="h-24 bg-neutral-200 rounded animate-pulse" />
          </div>
        </Card>
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <Card className="p-4 sm:p-6 lg:p-8 border-2 border-warning-200 bg-warning-50">
          <div className="relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-warning-500 via-warning-400 to-warning-500"></div>

            <div className="space-y-4 sm:space-y-6 pt-2">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-xl sm:text-2xl font-bold text-neutral-900">💡 Luci</h2>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-200 rounded-full">
                  <span className="w-2 h-2 bg-neutral-500 rounded-full"></span>
                  <span className="text-xs font-medium text-neutral-700">Offline</span>
                </div>
              </div>

              {/* Not connected message */}
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🔌</div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                  Luci Non Connesse
                </h3>
                <p className="text-sm text-neutral-600 mb-6">
                  Connetti il tuo account Philips Hue per controllare le luci
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    variant="success"
                    onClick={handleAuth}
                    icon="🔗"
                  >
                    Connetti Philips Hue
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push('/lights')}
                  >
                    Maggiori Info
                  </Button>
                </div>
              </div>

              {error && (
                <div className="mt-4 p-3 bg-primary-50 border border-primary-200 rounded-lg">
                  <p className="text-xs text-primary-700">⚠️ {error}</p>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const isRoomOn = selectedRoom?.services?.some(s => {
    const light = lights.find(l => l.id === s.rid);
    return light?.on?.on;
  }) || false;

  const avgBrightness = selectedRoom ? Math.round(
    roomLights.reduce((sum, l) => sum + (l.dimming?.brightness || 0), 0) / roomLights.length
  ) : 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      {error && (
        <Banner
          variant="error"
          icon="⚠️"
          title="Errore Connessione"
          description={error}
          dismissible
          onDismiss={() => setError(null)}
        />
      )}

      {/* Main Status Card */}
      <Card className={`overflow-hidden border-2 transition-all duration-300 ${isRoomOn ? 'bg-warning-50 border-warning-200' : 'bg-neutral-50 border-neutral-200'}`}>
        <div className="relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-warning-500 via-warning-400 to-warning-500"></div>

          <div className="p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900">💡 Luci</h2>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="group relative p-2 sm:p-3 rounded-xl hover:bg-white/70 active:scale-95 transition-all duration-200 disabled:opacity-50"
                title="Aggiorna stato"
              >
                <span className={`text-lg sm:text-xl inline-block ${refreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-300'}`}>
                  {refreshing ? '⏳' : '🔄'}
                </span>
              </button>
            </div>

            {/* Room Selection */}
            {rooms.length > 1 && (
              <div className="mb-4 sm:mb-6">
                <Select
                  label="🚪 Seleziona Stanza"
                  value={selectedRoomId || ''}
                  onChange={(e) => setSelectedRoomId(e.target.value)}
                  options={rooms.map(room => ({
                    value: room.id,
                    label: room.metadata?.name || 'Stanza'
                  }))}
                  className="text-base sm:text-lg"
                />
              </div>
            )}

            {/* Selected Room Controls */}
            {selectedRoom ? (
              <div className="space-y-4 sm:space-y-6">
                {/* On/Off + Brightness */}
                <div className="p-4 sm:p-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/80 shadow-sm">
                  {roomLights.length === 1 && (
                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-4 text-center">
                      {selectedRoom.metadata?.name || 'Stanza'}
                    </p>
                  )}

                  {/* On/Off Buttons */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <Button
                      variant={isRoomOn ? "success" : "outline"}
                      onClick={() => handleRoomToggle(selectedRoom.id, true)}
                      icon="💡"
                      className="w-full"
                    >
                      Accendi
                    </Button>
                    <Button
                      variant={!isRoomOn ? "danger" : "outline"}
                      onClick={() => handleRoomToggle(selectedRoom.id, false)}
                      icon="🌙"
                      className="w-full"
                    >
                      Spegni
                    </Button>
                  </div>

                  {/* Brightness Slider */}
                  {isRoomOn && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-neutral-700">
                          ☀️ Luminosità
                        </label>
                        <span className="text-sm font-bold text-neutral-800">
                          {avgBrightness}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="100"
                        value={avgBrightness}
                        onChange={(e) => handleBrightnessChange(selectedRoom.id, e.target.value)}
                        className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-warning-500"
                      />
                    </div>
                  )}
                </div>

                {/* Scenes */}
                {roomScenes.length > 0 && (
                  <>
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-neutral-200"></div>
                      </div>
                      <div className="relative flex justify-center text-xs sm:text-sm">
                        <span className="px-2 sm:px-3 bg-white/60 text-neutral-500 font-medium rounded-full">Scene</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                      {roomScenes.slice(0, 6).map((scene) => (
                        <button
                          key={scene.id}
                          onClick={() => handleSceneActivate(scene.id)}
                          className="p-3 sm:p-4 rounded-xl border-2 bg-white/60 border-neutral-200 text-neutral-600 hover:bg-warning-50 hover:border-warning-300 transition-all duration-200 active:scale-95"
                        >
                          <div className="text-2xl mb-1">🎨</div>
                          <div className="text-xs font-semibold truncate">
                            {scene.metadata?.name || 'Scena'}
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {/* Separator */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-neutral-200"></div>
                  </div>
                  <div className="relative flex justify-center text-xs sm:text-sm">
                    <span className="px-2 sm:px-3 bg-white/60 text-neutral-500 font-medium rounded-full">Informazioni</span>
                  </div>
                </div>

                {/* Summary Info */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div className="flex flex-col items-center p-3 sm:p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/80">
                    <span className="text-2xl sm:text-3xl mb-1">💡</span>
                    <p className="text-xs text-neutral-500">Luci Stanza</p>
                    <p className="text-sm font-bold text-neutral-800">{roomLights.length}</p>
                  </div>

                  <div className="flex flex-col items-center p-3 sm:p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/80">
                    <span className="text-2xl sm:text-3xl mb-1">🚪</span>
                    <p className="text-xs text-neutral-500">Stanze</p>
                    <p className="text-sm font-bold text-neutral-800">{rooms.length}</p>
                  </div>

                  <div className="flex flex-col items-center p-3 sm:p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/80 col-span-2 sm:col-span-1">
                    <span className="text-2xl sm:text-3xl mb-1">🎨</span>
                    <p className="text-xs text-neutral-500">Scene</p>
                    <p className="text-sm font-bold text-neutral-800">{scenes.length}</p>
                  </div>
                </div>

                {/* Link to full page */}
                <div>
                  <Button
                    variant="outline"
                    onClick={() => router.push('/lights')}
                    className="w-full"
                    size="sm"
                  >
                    Tutte le Stanze e Scene →
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-neutral-500">Nessuna stanza disponibile</p>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
