'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import Select from '../../ui/Select';
import Skeleton from '../../ui/Skeleton';
import Banner from '../../ui/Banner';
import LoadingOverlay from '../../ui/LoadingOverlay';
import { Divider, Heading, Text, EmptyState } from '../../ui';

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

  // Loading overlay message
  const [loadingMessage, setLoadingMessage] = useState('Caricamento...');

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
      setLoadingMessage(on ? 'Accensione luci...' : 'Spegnimento luci...');
      setRefreshing(true);
      setError(null);
      const response = await fetch(`/api/hue/rooms/${roomId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ on: { on } }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);
      // Aggiorna dati dopo il comando
      await fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setRefreshing(false);
    }
  }

  async function handleBrightnessChange(roomId, brightness) {
    try {
      setLoadingMessage('Modifica luminosità...');
      setRefreshing(true);
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
      // Aggiorna dati dopo il comando
      await fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setRefreshing(false);
    }
  }

  async function handleSceneActivate(sceneId) {
    try {
      setLoadingMessage('Attivazione scena...');
      setRefreshing(true);
      setError(null);
      const response = await fetch(`/api/hue/scenes/${sceneId}/activate`, {
        method: 'PUT',
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);
      // Aggiorna dati dopo il comando
      await fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setRefreshing(false);
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
    return <Skeleton.LightsCard />;
  }

  if (!connected) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <Card liquid className="overflow-visible transition-all duration-500">
          <div className="relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-warning-500 via-warning-400 to-warning-500 opacity-80"></div>

            <div className="p-6 sm:p-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-2xl sm:text-3xl">💡</span>
                  <Heading level={2} size="xl">Luci</Heading>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full">
                  <span className="w-2 h-2 bg-neutral-500 dark:bg-neutral-400 rounded-full"></span>
                  <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Offline</span>
                </div>
              </div>

              {/* Not connected message */}
              <EmptyState
                icon="🔌"
                title="Luci Non Connesse"
                description="Connetti il tuo account Philips Hue per controllare le luci"
                action={
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                      liquid
                      variant="success"
                      onClick={handleAuth}
                      icon="🔗"
                    >
                      Connetti Philips Hue
                    </Button>
                    <Button
                      liquid
                      variant="outline"
                      onClick={() => router.push('/lights')}
                    >
                      Maggiori Info
                    </Button>
                  </div>
                }
              />

              {error && (
                <div className="mt-4">
                  <Banner
                    liquid
                    variant="error"
                    icon="⚠️"
                    description={error}
                  />
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
      {/* Loading Overlay - Full page blocking */}
      <LoadingOverlay
        show={refreshing}
        message={loadingMessage}
        icon="💡"
      />

      {/* Main Status Card */}
      <Card liquid className="overflow-visible transition-all duration-500">
        <div className="relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-warning-500 via-accent-500 to-warning-500 opacity-80"></div>

          <div className="p-6 sm:p-8">
            {/* Error Banner - Inside card */}
            {error && (
              <div className="mb-4 sm:mb-6">
                <Banner
                  liquid
                  variant="error"
                  icon="⚠️"
                  title="Errore Connessione"
                  description={error}
                  dismissible
                  onDismiss={() => setError(null)}
                />
              </div>
            )}

            {/* Header - Simplified without refresh button */}
            <div className="flex items-center gap-2 mb-6">
              <span className="text-2xl sm:text-3xl">💡</span>
              <Heading level={2} size="xl">Luci</Heading>
            </div>

            {/* Room Selection */}
            {rooms.length > 1 && (
              <div className="mb-4 sm:mb-6">
                <Select
                  liquid
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
                {/* Main Control Area - Enhanced */}
                <div className={`relative rounded-2xl p-6 sm:p-8 shadow-liquid hover:shadow-liquid-lg transition-all duration-500 ${
                  isRoomOn
                    ? 'bg-gradient-to-br from-warning-50 to-warning-100 dark:from-warning-900/20 dark:to-warning-800/20'
                    : 'bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900/20 dark:to-neutral-800/20'
                }`}>
                  {/* ON Badge */}
                  {isRoomOn && (
                    <div className="absolute -top-2 -right-2 z-20">
                      <div className="relative">
                        <div className="absolute inset-0 bg-warning-500/20 rounded-full blur-lg animate-pulse"></div>
                        <div className="relative bg-gradient-to-br from-warning-500 to-warning-600 text-white px-3 py-1.5 rounded-full shadow-elevated-lg ring-2 ring-white/40">
                          <span className="text-xs font-bold">💡 ACCESO</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Room name (solo se c'è una sola stanza) */}
                  {roomLights.length === 1 && (
                    <div className="text-center mb-6">
                      <Heading level={3} size="sm" variant="subtle" className="uppercase tracking-wider">
                        {selectedRoom.metadata?.name || 'Stanza'}
                      </Heading>
                    </div>
                  )}

                  {/* On/Off Buttons */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <Button
                      liquid
                      variant={isRoomOn ? "success" : "outline"}
                      onClick={() => handleRoomToggle(selectedRoom.id, true)}
                      disabled={refreshing}
                      icon="💡"
                      size="lg"
                      className="h-16 sm:h-20"
                    >
                      Accendi
                    </Button>
                    <Button
                      liquid
                      variant={!isRoomOn ? "danger" : "outline"}
                      onClick={() => handleRoomToggle(selectedRoom.id, false)}
                      disabled={refreshing}
                      icon="🌙"
                      size="lg"
                      className="h-16 sm:h-20"
                    >
                      Spegni
                    </Button>
                  </div>

                  {/* Brightness Control - Enhanced with +/- buttons */}
                  {isRoomOn && (
                    <div className="relative overflow-hidden rounded-2xl shadow-liquid backdrop-blur-3xl bg-white/[0.15] dark:bg-white/[0.08] p-4 sm:p-5">
                      <div className="relative z-10 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">☀️</span>
                            <Heading level={4} size="sm">Luminosità</Heading>
                          </div>
                          <span className="text-2xl sm:text-3xl font-black text-warning-600 dark:text-warning-400">
                            {avgBrightness}%
                          </span>
                        </div>

                        {/* Slider */}
                        <input
                          type="range"
                          min="1"
                          max="100"
                          value={avgBrightness}
                          onChange={(e) => handleBrightnessChange(selectedRoom.id, e.target.value)}
                          disabled={refreshing}
                          className="w-full h-3 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-warning-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        />

                        {/* +/- Buttons */}
                        <div className="flex items-center gap-2">
                          <Button
                            liquid
                            variant="outline"
                            size="sm"
                            icon="➖"
                            onClick={() => {
                              const newValue = Math.max(1, avgBrightness - 5);
                              handleBrightnessChange(selectedRoom.id, newValue.toString());
                            }}
                            disabled={refreshing || avgBrightness <= 1}
                            className="flex-1"
                          >
                            -5%
                          </Button>
                          <Button
                            liquid
                            variant="outline"
                            size="sm"
                            icon="➕"
                            onClick={() => {
                              const newValue = Math.min(100, avgBrightness + 5);
                              handleBrightnessChange(selectedRoom.id, newValue.toString());
                            }}
                            disabled={refreshing || avgBrightness >= 100}
                            className="flex-1"
                          >
                            +5%
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Scenes - Horizontal Scroll (All scenes) */}
                {roomScenes.length > 0 && (
                  <>
                    <Divider label="Scene" variant="gradient" spacing="large" />

                    {/* Scrollable container */}
                    <div className="relative">
                      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
                        {roomScenes.map((scene) => (
                          <button
                            key={scene.id}
                            onClick={() => handleSceneActivate(scene.id)}
                            disabled={refreshing}
                            className="flex-shrink-0 w-32 sm:w-36 p-4 rounded-xl border-2 bg-white/60 dark:bg-white/[0.03] border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-warning-50 dark:hover:bg-warning-900/20 hover:border-warning-300 dark:hover:border-warning-600 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed snap-start"
                          >
                            <div className="text-3xl mb-2">🎨</div>
                            <div className="text-xs font-semibold truncate">
                              {scene.metadata?.name || 'Scena'}
                            </div>
                          </button>
                        ))}
                      </div>

                      {/* Scroll indicator */}
                      {roomScenes.length > 3 && (
                        <div className="text-center mt-2">
                          <Text variant="tertiary" className="text-xs">
                            ← Scorri per vedere tutte le {roomScenes.length} scene →
                          </Text>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Separator */}
                <Divider label="Informazioni" variant="gradient" spacing="large" />

                {/* Summary Info - Enhanced */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div className="relative overflow-hidden rounded-2xl shadow-liquid backdrop-blur-3xl bg-white/[0.08] dark:bg-white/[0.05] border border-white/20 dark:border-white/10">
                    <div className="relative z-10 flex flex-col items-center justify-center p-4 sm:p-5 min-h-[100px]">
                      <span className="text-3xl sm:text-4xl mb-2">💡</span>
                      <Text variant="tertiary" className="text-[10px] sm:text-xs uppercase tracking-wider font-bold mb-1">
                        Luci Stanza
                      </Text>
                      <span className="text-2xl sm:text-3xl font-black text-neutral-800 dark:text-neutral-100">
                        {roomLights.length}
                      </span>
                    </div>
                  </div>

                  <div className="relative overflow-hidden rounded-2xl shadow-liquid backdrop-blur-3xl bg-white/[0.08] dark:bg-white/[0.05] border border-white/20 dark:border-white/10">
                    <div className="relative z-10 flex flex-col items-center justify-center p-4 sm:p-5 min-h-[100px]">
                      <span className="text-3xl sm:text-4xl mb-2">🚪</span>
                      <Text variant="tertiary" className="text-[10px] sm:text-xs uppercase tracking-wider font-bold mb-1">
                        Stanze
                      </Text>
                      <span className="text-2xl sm:text-3xl font-black text-neutral-800 dark:text-neutral-100">
                        {rooms.length}
                      </span>
                    </div>
                  </div>

                  <div className="relative overflow-hidden rounded-2xl shadow-liquid backdrop-blur-3xl bg-white/[0.08] dark:bg-white/[0.05] border border-white/20 dark:border-white/10 col-span-2 sm:col-span-1">
                    <div className="relative z-10 flex flex-col items-center justify-center p-4 sm:p-5 min-h-[100px]">
                      <span className="text-3xl sm:text-4xl mb-2">🎨</span>
                      <Text variant="tertiary" className="text-[10px] sm:text-xs uppercase tracking-wider font-bold mb-1">
                        Scene
                      </Text>
                      <span className="text-2xl sm:text-3xl font-black text-neutral-800 dark:text-neutral-100">
                        {scenes.length}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Link to full page */}
                <div>
                  <Button
                    liquid
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
              <EmptyState
                icon="💡"
                title="Nessuna stanza disponibile"
              />
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
