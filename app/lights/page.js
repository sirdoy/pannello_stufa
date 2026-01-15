'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Skeleton, EmptyState, Heading, Text, Divider, Banner } from '@/app/components/ui';
import { COLOR_PRESETS, supportsColor } from '@/lib/hue/colorUtils';

/**
 * Lights Page - Complete Philips Hue control
 * Full view with rooms, individual lights, and scenes
 */
export default function LightsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [connected, setConnected] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [lights, setLights] = useState([]);
  const [scenes, setScenes] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedRoom, setExpandedRoom] = useState(null);
  const [activatingScene, setActivatingScene] = useState(null);
  const [changingColor, setChangingColor] = useState(null);

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

  async function checkConnection() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/hue/status');
      const data = await response.json();

      setConnected(data.connected || false);
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

  async function handleRoomToggle(groupedLightId, on) {
    try {
      setRefreshing(true);
      setError(null);
      const response = await fetch(`/api/hue/rooms/${groupedLightId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ on: { on } }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);
      await fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setRefreshing(false);
    }
  }

  async function handleLightToggle(lightId, on) {
    try {
      setRefreshing(true);
      setError(null);
      const response = await fetch(`/api/hue/lights/${lightId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ on: { on } }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);
      await fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setRefreshing(false);
    }
  }

  async function handleBrightnessChange(groupedLightId, brightness) {
    try {
      setRefreshing(true);
      setError(null);
      const response = await fetch(`/api/hue/rooms/${groupedLightId}`, {
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
    } finally {
      setRefreshing(false);
    }
  }

  async function handleLightBrightnessChange(lightId, brightness) {
    try {
      setRefreshing(true);
      setError(null);
      const response = await fetch(`/api/hue/lights/${lightId}`, {
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
    } finally {
      setRefreshing(false);
    }
  }

  async function handleLightColorChange(lightId, colorPreset) {
    try {
      setChangingColor(lightId);
      setError(null);
      setSuccess(null);

      const response = await fetch(`/api/hue/lights/${lightId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          color: { xy: colorPreset.xy }
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setSuccess(`Colore cambiato a ${colorPreset.name}`);
      setTimeout(() => setSuccess(null), 2000);
      await fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setChangingColor(null);
    }
  }

  async function handleActivateScene(sceneId, sceneName) {
    try {
      setActivatingScene(sceneId);
      setError(null);
      setSuccess(null);

      const response = await fetch(`/api/hue/scenes/${sceneId}/activate`, {
        method: 'PUT',
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setSuccess(`Scena "${sceneName}" attivata`);
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setActivatingScene(null);
    }
  }

  // Helper to get grouped_light ID
  const getGroupedLightId = (room) => {
    if (!room?.services) return null;
    const groupedLight = room.services.find(s => s.rtype === 'grouped_light');
    return groupedLight?.rid || null;
  };

  // Helper to get room lights (use 'children' not 'services')
  const getRoomLights = (room) => {
    if (!room?.children || !lights.length) return [];
    return lights.filter(light =>
      room.children.some(c => c.rid === light.id && c.rtype === 'light')
    );
  };

  // Helper to get room scenes
  const getRoomScenes = (room) => {
    if (!room?.id || !scenes.length) return [];
    return scenes.filter(scene => scene.group?.rid === room.id);
  };

  if (loading) {
    return <Skeleton.LightsCard />;
  }

  if (!connected) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="p-8">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">
            Bridge Hue Non Connesso
          </h2>

          <p className="text-neutral-600 dark:text-neutral-400 mb-6">
            Effettua il pairing con il bridge Hue dalla homepage per controllare le luci.
          </p>

          <Button variant="primary" onClick={() => router.push('/')}>
            ← Torna alla Homepage
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push('/')}
          size="sm"
          className="mb-4"
        >
          ← Indietro
        </Button>

        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">
          💡 Controllo Luci Philips Hue
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Gestisci stanze, luci individuali e scene
        </p>
      </div>

      {/* Success Banner */}
      {success && (
        <div className="mb-6">
          <Banner
            variant="success"
            icon="✅"
            title={success}
            dismissible
            onDismiss={() => setSuccess(null)}
          />
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="mb-6">
          <Banner
            variant="error"
            icon="⚠️"
            title="Errore"
            description={error}
            dismissible
            onDismiss={() => setError(null)}
          />
        </div>
      )}

      {/* Quick Stats */}
      <Card className="p-6 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="grid grid-cols-3 gap-6">
            <div>
              <Text variant="label" size="xs" className="mb-1">Stanze</Text>
              <Heading level={3} size="lg">{rooms.length}</Heading>
            </div>
            <div>
              <Text variant="label" size="xs" className="mb-1">Luci</Text>
              <Heading level={3} size="lg">{lights.length}</Heading>
            </div>
            <div>
              <Text variant="label" size="xs" className="mb-1">Scene</Text>
              <Heading level={3} size="lg">{scenes.length}</Heading>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={handleRefresh}
            loading={refreshing}
            size="sm"
          >
            🔄 Aggiorna
          </Button>
        </div>
      </Card>

      {/* Rooms with detailed controls */}
      {rooms.length > 0 && (
        <div className="space-y-6 mb-8">
          <Heading level={2} size="md">🏠 Stanze</Heading>

          {rooms.map(room => {
            const groupedLightId = getGroupedLightId(room);
            const roomLights = getRoomLights(room);
            const roomScenes = getRoomScenes(room);
            const isExpanded = expandedRoom === room.id;
            const isOn = roomLights.some(l => l.on?.on);
            const avgBrightness = isOn && roomLights.length > 0 ? Math.round(
              roomLights.reduce((sum, l) => sum + (l.dimming?.brightness || 0), 0) / roomLights.length
            ) : 0;

            return (
              <Card key={room.id} className="overflow-hidden">
                {/* Room Header */}
                <div className={`p-6 ${isOn ? 'bg-gradient-to-br from-warning-50 to-warning-100 dark:from-warning-900/20 dark:to-warning-800/20' : ''}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <Heading level={3} size="md" className="mb-1">
                        {room.metadata?.name || 'Stanza'}
                      </Heading>
                      <Text variant="tertiary" size="xs">
                        {roomLights.length} {roomLights.length === 1 ? 'luce' : 'luci'} • {roomScenes.length} {roomScenes.length === 1 ? 'scena' : 'scene'}
                      </Text>
                    </div>
                    {isOn && (
                      <div className="px-3 py-1 bg-warning-500 text-white text-xs font-bold rounded-full">
                        ACCESO
                      </div>
                    )}
                  </div>

                  {/* Room Controls */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <Button
                      variant={isOn ? "success" : "outline"}
                      onClick={() => handleRoomToggle(groupedLightId, true)}
                      disabled={refreshing || !groupedLightId}
                      size="sm"
                      icon="💡"
                    >
                      Accendi Stanza
                    </Button>
                    <Button
                      variant={!isOn ? "danger" : "outline"}
                      onClick={() => handleRoomToggle(groupedLightId, false)}
                      disabled={refreshing || !groupedLightId}
                      size="sm"
                      icon="🌙"
                    >
                      Spegni Stanza
                    </Button>
                  </div>

                  {/* Room Brightness */}
                  {isOn && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Text variant="secondary" size="xs">Luminosità Stanza</Text>
                        <Text variant="body" size="sm" weight="bold">{avgBrightness}%</Text>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="100"
                        value={avgBrightness}
                        onChange={(e) => handleBrightnessChange(groupedLightId, e.target.value)}
                        disabled={refreshing || !groupedLightId}
                        className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-warning-500"
                      />
                    </div>
                  )}

                  {/* Expand Button */}
                  {(roomLights.length > 0 || roomScenes.length > 0) && (
                    <Button
                      variant="ghost"
                      onClick={() => setExpandedRoom(isExpanded ? null : room.id)}
                      size="sm"
                      className="w-full mt-4"
                    >
                      {isExpanded ? '▲ Nascondi Dettagli' : '▼ Mostra Dettagli'} ({roomLights.length} luci, {roomScenes.length} scene)
                    </Button>
                  )}
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-6 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/20">
                    {/* Individual Lights */}
                    {roomLights.length > 0 && (
                      <>
                        <Heading level={4} size="sm" className="mb-3">💡 Luci Individuali</Heading>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                          {roomLights.map(light => {
                            const lightOn = light.on?.on;
                            const lightBrightness = light.dimming?.brightness || 0;
                            const hasColor = supportsColor(light);

                            return (
                              <div
                                key={light.id}
                                className={`p-4 rounded-xl border-2 ${
                                  lightOn
                                    ? 'border-warning-300 dark:border-warning-600 bg-warning-50 dark:bg-warning-900/10'
                                    : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div>
                                    <Text size="sm" weight="semibold">{light.metadata?.name || 'Luce'}</Text>
                                    {hasColor && <Text variant="tertiary" size="xs">🎨 Colore disponibile</Text>}
                                  </div>
                                  {lightOn && <span className="text-xs text-warning-600 dark:text-warning-400">ON</span>}
                                </div>

                                <div className="grid grid-cols-2 gap-2 mb-2">
                                  <Button
                                    variant={lightOn ? "success" : "outline"}
                                    onClick={() => handleLightToggle(light.id, true)}
                                    disabled={refreshing}
                                    size="xs"
                                  >
                                    On
                                  </Button>
                                  <Button
                                    variant={!lightOn ? "danger" : "outline"}
                                    onClick={() => handleLightToggle(light.id, false)}
                                    disabled={refreshing}
                                    size="xs"
                                  >
                                    Off
                                  </Button>
                                </div>

                                {lightOn && (
                                  <div className="space-y-3">
                                    {/* Brightness Control */}
                                    <div className="space-y-1">
                                      <div className="flex items-center justify-between">
                                        <Text variant="tertiary" size="xs">Luminosità</Text>
                                        <Text size="xs" weight="bold">{Math.round(lightBrightness)}%</Text>
                                      </div>
                                      <input
                                        type="range"
                                        min="1"
                                        max="100"
                                        value={lightBrightness}
                                        onChange={(e) => handleLightBrightnessChange(light.id, e.target.value)}
                                        disabled={refreshing}
                                        className="w-full h-1 bg-neutral-200 dark:bg-neutral-700 rounded appearance-none cursor-pointer accent-warning-500"
                                      />
                                    </div>

                                    {/* Color Control (only if supported) */}
                                    {hasColor && (
                                      <div className="space-y-1.5">
                                        <Text variant="tertiary" size="xs">Colore</Text>
                                        <div className="grid grid-cols-5 gap-1.5">
                                          {COLOR_PRESETS.map(preset => (
                                            <button
                                              key={preset.name}
                                              onClick={() => handleLightColorChange(light.id, preset)}
                                              disabled={changingColor === light.id}
                                              className="relative w-full aspect-square rounded-lg border-2 border-neutral-300 dark:border-neutral-600 hover:border-neutral-500 dark:hover:border-neutral-400 transition-all active:scale-95 disabled:opacity-50"
                                              style={{ backgroundColor: preset.hex }}
                                              title={preset.name}
                                            >
                                              {changingColor === light.id && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg">
                                                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                </div>
                                              )}
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}

                    {/* Room Scenes */}
                    {roomScenes.length > 0 && (
                      <>
                        <Heading level={4} size="sm" className="mb-3">🎨 Scene della Stanza</Heading>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {roomScenes.map(scene => (
                            <button
                              key={scene.id}
                              onClick={() => handleActivateScene(scene.id, scene.metadata?.name)}
                              disabled={activatingScene === scene.id}
                              className={`relative p-4 rounded-xl border-2 transition-all active:scale-95 ${
                                activatingScene === scene.id
                                  ? 'border-warning-500 bg-warning-50 dark:bg-warning-900/20'
                                  : 'border-neutral-200 dark:border-neutral-700 hover:border-warning-300 dark:hover:border-warning-600'
                              }`}
                            >
                              <div className="text-2xl mb-1">🎨</div>
                              <Text size="xs" weight="semibold" className="text-center">
                                {scene.metadata?.name || 'Scena'}
                              </Text>
                              {activatingScene === scene.id && (
                                <div className="absolute top-1 right-1">
                                  <div className="w-3 h-3 border-2 border-warning-500 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {rooms.length === 0 && (
        <EmptyState
          icon="💡"
          title="Nessuna stanza trovata"
          description="Configura le stanze nell'app Philips Hue"
        />
      )}
    </div>
  );
}
