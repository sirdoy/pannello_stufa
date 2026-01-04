'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Skeleton from '../../ui/Skeleton';
import DeviceCard from '../../ui/DeviceCard';
import RoomSelector from '../../ui/RoomSelector';
import { Divider, Heading, Button, EmptyState, Text } from '../../ui';
import { supportsColor } from '@/lib/hue/colorUtils';

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

  // Pairing state
  const [pairing, setPairing] = useState(false);
  const [pairingStep, setPairingStep] = useState(null); // 'discovering' | 'pairing' | 'success'
  const [discoveredBridges, setDiscoveredBridges] = useState([]);
  const [selectedBridge, setSelectedBridge] = useState(null);
  const [pairingCountdown, setPairingCountdown] = useState(30);
  const [pairingError, setPairingError] = useState(null);

  const connectionCheckedRef = useRef(false);
  const pollingStartedRef = useRef(false);
  const pairingTimerRef = useRef(null);

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

  // Extract grouped_light ID from room services
  const getGroupedLightId = (room) => {
    if (!room?.services) return null;
    const groupedLight = room.services.find(s => s.rtype === 'grouped_light');
    return groupedLight?.rid || null;
  };

  const selectedRoomGroupedLightId = getGroupedLightId(selectedRoom);

  // Use 'children' instead of 'services' to get individual lights
  // In Hue API v2: services = grouped_light/scenes, children = individual lights
  const roomLights = lights.filter(light =>
    selectedRoom?.children?.some(c => c.rid === light.id && c.rtype === 'light')
  );
  const roomScenes = scenes.filter(scene =>
    scene.group?.rid === selectedRoom?.id
  );

  // Check if room has any color-capable lights
  const hasColorLights = roomLights.some(light => supportsColor(light));

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

  // FUTURE: Remote API support (OAuth flow)
  // const handleAuth = () => {
  //   const clientId = process.env.NEXT_PUBLIC_HUE_CLIENT_ID;
  //   const redirectUri = process.env.NEXT_PUBLIC_HUE_REDIRECT_URI;
  //   const state = Math.random().toString(36).substring(7);
  //   const scope = 'lights scenes groups devices bridge';
  //   window.location.href = `https://api.meethue.com/v2/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&state=${state}&scope=${encodeURIComponent(scope)}`;
  // };

  /**
   * Local API Pairing Flow
   * Step 1: Discover bridges
   */
  async function handleStartPairing() {
    try {
      setPairing(true);
      setPairingStep('discovering');
      setPairingError(null);
      setError(null);

      const response = await fetch('/api/hue/discover');
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (!data.bridges || data.bridges.length === 0) {
        throw new Error('Nessun bridge Hue trovato sulla rete. Assicurati che il bridge sia acceso e collegato alla stessa rete Wi-Fi.');
      }

      setDiscoveredBridges(data.bridges);

      // Auto-select if only one bridge
      if (data.bridges.length === 1) {
        setSelectedBridge(data.bridges[0]);
        await handlePairWithBridge(data.bridges[0]);
      } else {
        setPairingStep('selectBridge');
      }
    } catch (err) {
      console.error('Discovery error:', err);
      setPairingError(err.message);
      setPairing(false);
    }
  }

  /**
   * Step 2: Pair with selected bridge (requires button press)
   */
  async function handlePairWithBridge(bridge) {
    try {
      setPairingStep('pairing');
      setPairingError(null);
      setPairingCountdown(30);

      // Start countdown timer
      pairingTimerRef.current = setInterval(() => {
        setPairingCountdown(prev => {
          if (prev <= 1) {
            clearInterval(pairingTimerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Attempt pairing
      const response = await fetch('/api/hue/pair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bridgeIp: bridge.internalipaddress,
          bridgeId: bridge.id,
        }),
      });

      const data = await response.json();

      if (pairingTimerRef.current) {
        clearInterval(pairingTimerRef.current);
      }

      if (data.error === 'LINK_BUTTON_NOT_PRESSED') {
        throw new Error('Pulsante bridge non premuto. Premi il pulsante sul bridge e riprova.');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.success) {
        setPairingStep('success');
        setTimeout(() => {
          setPairing(false);
          setPairingStep(null);
          checkConnection();
        }, 2000);
      }
    } catch (err) {
      console.error('Pairing error:', err);
      setPairingError(err.message);
      if (pairingTimerRef.current) {
        clearInterval(pairingTimerRef.current);
      }
    }
  }

  /**
   * Retry pairing
   */
  function handleRetryPairing() {
    if (selectedBridge) {
      handlePairWithBridge(selectedBridge);
    } else {
      handleStartPairing();
    }
  }

  /**
   * Cancel pairing
   */
  function handleCancelPairing() {
    if (pairingTimerRef.current) {
      clearInterval(pairingTimerRef.current);
    }
    setPairing(false);
    setPairingStep(null);
    setPairingError(null);
    setSelectedBridge(null);
    setDiscoveredBridges([]);
  }

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (pairingTimerRef.current) {
        clearInterval(pairingTimerRef.current);
      }
    };
  }, []);

  // Build props for DeviceCard
  const banners = [];

  // Connection error
  if (error) {
    banners.push({
      variant: 'error',
      icon: '⚠️',
      title: 'Errore Connessione',
      description: error,
      dismissible: true,
      onDismiss: () => setError(null)
    });
  }

  // Pairing in progress
  if (pairing && pairingStep === 'pairing') {
    banners.push({
      variant: 'info',
      icon: '🔗',
      title: `Pairing in corso... (${pairingCountdown}s)`,
      description: 'Premi il pulsante sul bridge Hue entro 30 secondi per completare la connessione.',
      actions: [
        { label: 'Annulla', onClick: handleCancelPairing }
      ]
    });
  }

  // Pairing success
  if (pairing && pairingStep === 'success') {
    banners.push({
      variant: 'success',
      icon: '✅',
      title: 'Pairing completato!',
      description: 'Bridge Hue connesso con successo.'
    });
  }

  // Pairing error
  if (pairingError) {
    banners.push({
      variant: 'error',
      icon: '⚠️',
      title: 'Errore Pairing',
      description: pairingError,
      dismissible: true,
      onDismiss: () => setPairingError(null),
      actions: [
        { label: 'Riprova', onClick: handleRetryPairing },
        { label: 'Annulla', onClick: handleCancelPairing }
      ]
    });
  }

  // Discovering bridges
  if (pairing && pairingStep === 'discovering') {
    banners.push({
      variant: 'info',
      icon: '🔍',
      title: 'Ricerca bridge...',
      description: 'Ricerca bridge Hue sulla rete locale in corso...'
    });
  }

  const infoBoxes = selectedRoom ? [
    { icon: '💡', label: 'Luci Stanza', value: roomLights.length },
    { icon: '🚪', label: 'Stanze', value: rooms.length },
    { icon: '🎨', label: 'Scene', value: scenes.length },
  ] : [];

  const footerActions = selectedRoom ? [{
    label: 'Tutte le Stanze e Scene →',
    variant: 'outline',
    size: 'sm',
    onClick: () => router.push('/lights')
  }] : [];

  const isRoomOn = selectedRoom?.services?.some(s => {
    const light = lights.find(l => l.id === s.rid);
    return light?.on?.on;
  }) || false;

  const avgBrightness = selectedRoom ? Math.round(
    roomLights.reduce((sum, l) => sum + (l.dimming?.brightness || 0), 0) / roomLights.length
  ) : 0;

  return (
    <DeviceCard
      icon="💡"
      title="Luci"
      colorTheme="warning"
      connected={connected}
      onConnect={handleStartPairing}
      connectButtonLabel="Connetti Bridge Hue"
      connectInfoRoute="/lights"
      loading={loading || refreshing || pairing}
      loadingMessage={pairingStep === 'discovering' ? 'Ricerca bridge...' : pairingStep === 'pairing' ? `Pairing in corso... ${pairingCountdown}s` : loadingMessage}
      skeletonComponent={loading ? <Skeleton.LightsCard /> : null}
      banners={banners}
      infoBoxes={infoBoxes}
      infoBoxesTitle="Informazioni"
      footerActions={footerActions}
    >
      {/* Room Selection */}
      <RoomSelector
        rooms={rooms.map(room => ({
          id: room.id,
          name: room.metadata?.name || 'Stanza'
        }))}
        selectedRoomId={selectedRoomId}
        onChange={(e) => setSelectedRoomId(e.target.value)}
      />

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
                      onClick={() => handleRoomToggle(selectedRoomGroupedLightId, true)}
                      disabled={refreshing || !selectedRoomGroupedLightId}
                      icon="💡"
                      size="lg"
                      className="h-16 sm:h-20"
                    >
                      Accendi
                    </Button>
                    <Button
                      liquid
                      variant={!isRoomOn ? "danger" : "outline"}
                      onClick={() => handleRoomToggle(selectedRoomGroupedLightId, false)}
                      disabled={refreshing || !selectedRoomGroupedLightId}
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
                          onChange={(e) => handleBrightnessChange(selectedRoomGroupedLightId, e.target.value)}
                          disabled={refreshing || !selectedRoomGroupedLightId}
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
                              handleBrightnessChange(selectedRoomGroupedLightId, newValue.toString());
                            }}
                            disabled={refreshing || avgBrightness <= 1 || !selectedRoomGroupedLightId}
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
                              handleBrightnessChange(selectedRoomGroupedLightId, newValue.toString());
                            }}
                            disabled={refreshing || avgBrightness >= 100 || !selectedRoomGroupedLightId}
                            className="flex-1"
                          >
                            +5%
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Color Control Link (if available) */}
                  {isRoomOn && hasColorLights && (
                    <div className="mt-4">
                      <Button
                        liquid
                        variant="outline"
                        size="sm"
                        icon="🎨"
                        onClick={() => router.push('/lights')}
                        className="w-full"
                      >
                        Controllo Colore
                      </Button>
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

        </div>
      ) : (
        <EmptyState
          icon="💡"
          title="Nessuna stanza disponibile"
        />
      )}
    </DeviceCard>
  );
}
