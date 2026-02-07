'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Skeleton, EmptyState, Heading, Text, Divider, Banner, Slider, Badge } from '@/app/components/ui';
import { COLOR_PRESETS, supportsColor } from '@/lib/hue/colorUtils';
import { cn } from '@/lib/utils/cn';

/**
 * Lights Page - Complete Philips Hue control
 * Full view with rooms, individual lights, and scenes
 */
type PairingStep = 'discovering' | 'waitingForButtonPress' | 'pairing' | 'success' | 'remotePairing' | 'noLocalBridge' | 'selectBridge' | 'remotePairingWait';

interface HueRoom {
  id: string;
  name: string;
  lights: string[];
  on?: boolean;
  services?: Array<{ rid: string; rtype: string }>;
  children?: Array<{ rid: string; rtype: string }>;
  metadata?: { name: string; archetype?: string };
}

interface HueLight {
  id: string;
  name: string;
  on?: { on: boolean };
  dimming?: { brightness: number };
  color?: { xy?: { x: number; y: number } } | null;
  room?: string;
  owner?: { rid: string; rtype: string };
  metadata?: { name: string; archetype?: string };
}

interface HueScene {
  id: string;
  name: string;
  room?: string;
  group?: { rid: string; rtype: string };
  metadata?: { name: string };
}

interface HueBridge {
  id: string;
  ipaddress: string;
  internalipaddress?: string;
}

export default function LightsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const [rooms, setRooms] = useState<HueRoom[]>([]);
  const [lights, setLights] = useState<HueLight[]>([]);
  const [scenes, setScenes] = useState<HueScene[]>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [expandedRoom, setExpandedRoom] = useState<string | null>(null);
  const [activatingScene, setActivatingScene] = useState<string | null>(null);
  const [changingColor, setChangingColor] = useState<string | null>(null);

  // Connection status details
  const [needsRemotePairing, setNeedsRemotePairing] = useState<boolean>(false);

  // Pairing states
  const [pairing, setPairing] = useState<boolean>(false);
  const [pairingStep, setPairingStep] = useState<PairingStep | null>(null);
  const [pairingError, setPairingError] = useState<string | null>(null);
  const [discoveredBridges, setDiscoveredBridges] = useState<HueBridge[]>([]);
  const [selectedBridge, setSelectedBridge] = useState<HueBridge | null>(null);
  const [pairingCountdown, setPairingCountdown] = useState<number>(30);
  const pairingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const connectionCheckedRef = useRef<boolean>(false);
  const pollingStartedRef = useRef<boolean>(false);

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

  async function checkConnection(): Promise<void> {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/hue/status');
      const data: any = await response.json();

      setConnected(data.connected || false);

      // Check if OAuth is done but username is missing (needs remote pairing)
      // This happens when remote_connected=true but has_username=false
      if (data.remote_connected && !data.has_username) {
        setNeedsRemotePairing(true);
      } else {
        setNeedsRemotePairing(false);
      }
    } catch (err) {
      console.error('Errore connessione Hue:', err);
      setConnected(false);
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
    } finally {
      setLoading(false);
    }
  }

  async function fetchData(): Promise<void> {
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

      // Sort rooms with 'Casa' first, then alphabetical
      const sortedRooms = (roomsData.rooms || []).sort((a, b) => {
        if (a.metadata?.name === 'Casa') return -1;
        if (b.metadata?.name === 'Casa') return 1;
        return (a.metadata?.name || '').localeCompare(b.metadata?.name || '');
      });
      setRooms(sortedRooms);
      setLights(lightsData.lights || []);
      setScenes(scenesData.scenes || []);
    } catch (err) {
      console.error('Errore fetch dati Hue:', err);
      setError(err.message);
    }
  }

  async function handleRefresh(): Promise<void> {
    setRefreshing(true);
    await checkConnection();
    if (connected) await fetchData();
    setRefreshing(false);
  }

  async function handleRoomToggle(groupedLightId: string, on: boolean): Promise<void> {
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

  async function handleLightToggle(lightId: string, on: boolean): Promise<void> {
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

  async function handleBrightnessChange(groupedLightId: string, brightness: number): Promise<void> {
    try {
      setRefreshing(true);
      setError(null);
      const response = await fetch(`/api/hue/rooms/${groupedLightId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dimming: { brightness: brightness }
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

  async function handleLightBrightnessChange(lightId: string, brightness: number): Promise<void> {
    try {
      setRefreshing(true);
      setError(null);
      const response = await fetch(`/api/hue/lights/${lightId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dimming: { brightness: brightness }
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

  async function handleLightColorChange(lightId: string, colorPreset: any): Promise<void> {
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

  async function handleActivateScene(sceneId: string, sceneName: string): Promise<void> {
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

  async function handleAllLightsToggle(on: boolean): Promise<void> {
    try {
      setRefreshing(true);
      setError(null);
      setSuccess(null);

      // Get all grouped_light IDs from all rooms
      const groupedLightIds = rooms
        .map(room => room.services?.find(s => s.rtype === 'grouped_light')?.rid)
        .filter(Boolean);

      // Toggle all rooms in parallel
      await Promise.all(
        groupedLightIds.map(groupId =>
          fetch(`/api/hue/rooms/${groupId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ on: { on } }),
          })
        )
      );

      setSuccess(on ? 'Tutte le luci accese' : 'Tutte le luci spente');
      setTimeout(() => setSuccess(null), 2000);
      await fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setRefreshing(false);
    }
  }

  // Helper to get grouped_light ID
  const getGroupedLightId = (room) => {
    if (!room?.services) return null;
    const groupedLight = room.services.find(s => s.rtype === 'grouped_light');
    return groupedLight?.rid || null;
  };

  // Helper to get room lights (use 'children' not 'services')
  // Local API: children contains device IDs, match via light.owner.rid
  // Remote API: children may contain light IDs directly
  const getRoomLights = (room) => {
    if (!room?.children || !lights.length) return [];
    return lights.filter(light =>
      room.children.some(c =>
        c.rid === light.id || // Remote API: light ID in children
        c.rid === light.owner?.rid // Local API: device ID in children
      )
    );
  };

  // Helper to get room scenes
  const getRoomScenes = (room) => {
    if (!room?.id || !scenes.length) return [];
    return scenes.filter(scene => scene.group?.rid === room.id);
  };

  // Disconnect from Hue
  async function handleDisconnect(): Promise<void> {
    if (!confirm('Disconnettere il bridge Hue? Dovrai riconnetterti per controllare le luci.')) {
      return;
    }

    try {
      setRefreshing(true);
      const response = await fetch('/api/hue/disconnect', { method: 'POST' });
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setConnected(false);
      setRooms([]);
      setLights([]);
      setScenes([]);
      setSuccess('Bridge Hue disconnesso');
    } catch (err) {
      setError(err.message);
    } finally {
      setRefreshing(false);
    }
  }

  // Start local pairing flow
  async function handleStartPairing(): Promise<void> {
    try {
      setPairing(true);
      setPairingStep('discovering');
      setPairingError(null);
      setError(null);

      const response = await fetch('/api/hue/discover');

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Errore HTTP ${response.status}`;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch {
          if (response.status === 401) {
            errorMessage = 'Sessione scaduta. Ricarica la pagina.';
          }
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (!data.bridges || data.bridges.length === 0) {
        setPairingStep('noLocalBridge');
        return;
      }

      setDiscoveredBridges(data.bridges);

      if (data.bridges.length === 1) {
        setSelectedBridge(data.bridges[0]);
        setPairingStep('waitingForButtonPress');
      } else {
        setPairingStep('selectBridge');
      }
    } catch (err) {
      console.error('Discovery error:', err);
      setPairingError(err.message || 'Errore durante la ricerca del bridge');
      setPairing(false);
    }
  }

  // Pair with selected bridge
  async function handlePairWithBridge(bridge: HueBridge): Promise<void> {
    try {
      setPairingStep('pairing');
      setPairingError(null);
      setPairingCountdown(30);

      pairingTimerRef.current = setInterval(() => {
        setPairingCountdown(prev => {
          if (prev <= 1) {
            clearInterval(pairingTimerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

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

  function handleConfirmButtonPressed() {
    if (selectedBridge) {
      handlePairWithBridge(selectedBridge);
    }
  }

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

  // Start remote pairing flow (for cloud connection)
  function handleStartRemotePairing() {
    setPairing(true);
    setPairingStep('remotePairingWait');
    setPairingError(null);
  }

  // Execute remote pairing (after user pressed bridge button)
  async function handleExecuteRemotePairing(): Promise<void> {
    try {
      setPairingStep('remotePairing');
      setPairingError(null);

      const response = await fetch('/api/hue/remote/pair', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.error) {
        // Check for link button not pressed
        if (data.code === 'HUE_LINK_BUTTON_NOT_PRESSED') {
          throw new Error('Pulsante bridge non premuto. Premi il pulsante rotondo sul bridge e riprova entro 30 secondi.');
        }
        throw new Error(data.error);
      }

      if (data.paired) {
        setPairingStep('success');
        setNeedsRemotePairing(false);
        setTimeout(() => {
          setPairing(false);
          setPairingStep(null);
          checkConnection();
        }, 2000);
      }
    } catch (err) {
      console.error('Remote pairing error:', err);
      setPairingError(err.message);
      setPairingStep('remotePairingWait'); // Go back to wait state
    }
  }

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (pairingTimerRef.current) {
        clearInterval(pairingTimerRef.current);
      }
    };
  }, []);

  if (loading) {
    return <Skeleton.LightsCard />;
  }

  if (!connected || needsRemotePairing) {
    const remoteApiAvailable = !!process.env.NEXT_PUBLIC_HUE_CLIENT_ID;

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="p-8">
          <Heading level={1} size="lg" className="mb-4">
            {needsRemotePairing ? 'Completa Configurazione Cloud' : 'Bridge Hue Non Connesso'}
          </Heading>

          {/* Pairing Error */}
          {pairingError && (
            <Banner
              variant="error"
              icon="⚠️"
              title="Errore"
              description={pairingError}
              dismissible
              onDismiss={() => setPairingError(null)}
              className="mb-4"
            />
          )}

          {/* Remote Pairing Needed - OAuth done but username missing */}
          {needsRemotePairing && !pairing && (
            <>
              <Banner
                variant="warning"
                icon="☁️"
                title="Account Cloud connesso - serve un ultimo passaggio"
                description="Hai collegato il tuo account Philips Hue, ma serve creare la chiave di accesso al bridge. Premi il pulsante sul bridge Hue e clicca 'Completa Configurazione'."
                className="mb-4"
              />
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <Button variant="ember" onClick={handleStartRemotePairing}>
                  👆 Completa Configurazione
                </Button>
                <Button variant="ghost" onClick={handleDisconnect}>
                  🔌 Disconnetti
                </Button>
              </div>
              <Text variant="tertiary" size="sm">
                Questo passaggio è necessario solo la prima volta. Dopo, potrai controllare le luci da qualsiasi luogo.
              </Text>
            </>
          )}

          {/* Remote Pairing Wait - waiting for user to press button */}
          {pairing && pairingStep === 'remotePairingWait' && (
            <div className="mb-4">
              <Banner
                variant="warning"
                icon="👆"
                title="Premi il pulsante sul Bridge Hue"
                description="Vai al bridge Hue e premi il pulsante rotondo al centro. Poi torna qui e clicca 'Ho premuto il pulsante'."
                className="mb-4"
              />
              <div className="flex gap-3">
                <Button variant="ember" onClick={handleExecuteRemotePairing}>
                  ✓ Ho premuto il pulsante
                </Button>
                <Button variant="ghost" onClick={handleCancelPairing}>
                  Annulla
                </Button>
              </div>
            </div>
          )}

          {/* Remote Pairing in progress */}
          {pairing && pairingStep === 'remotePairing' && (
            <Banner
              variant="info"
              icon="🔗"
              title="Creazione chiave di accesso..."
              description="Attendi mentre creo la connessione con il bridge via cloud..."
              className="mb-4"
            />
          )}

          {/* Discovering */}
          {pairing && pairingStep === 'discovering' && (
            <Banner
              variant="info"
              icon="🔍"
              title="Ricerca bridge..."
              description="Ricerca bridge Hue sulla rete locale in corso..."
              className="mb-4"
            />
          )}

          {/* No local bridge found */}
          {pairing && pairingStep === 'noLocalBridge' && (
            <div className="mb-4">
              <Banner
                variant="warning"
                icon="☁️"
                title="Bridge non trovato sulla rete locale"
                description="Sei da remoto o il bridge non è sulla stessa rete Wi-Fi. Puoi connetterti via cloud."
                className="mb-4"
              />
              <div className="flex gap-3">
                {remoteApiAvailable && (
                  <Button
                    variant="ember"
                    onClick={() => window.location.href = '/api/hue/remote/authorize'}
                  >
                    ☁️ Connetti via Cloud
                  </Button>
                )}
                <Button variant="ghost" onClick={handleCancelPairing}>
                  Annulla
                </Button>
              </div>
            </div>
          )}

          {/* Waiting for button press */}
          {pairing && pairingStep === 'waitingForButtonPress' && (
            <div className="mb-4">
              <Banner
                variant="warning"
                icon="👆"
                title="Premi il pulsante sul Bridge Hue"
                description={`Bridge trovato: ${selectedBridge?.internalipaddress || 'N/A'}. Premi il pulsante rotondo al centro del bridge, poi clicca "Avvia Pairing".`}
                className="mb-4"
              />
              <div className="flex gap-3">
                <Button variant="ember" onClick={handleConfirmButtonPressed}>
                  ✓ Avvia Pairing
                </Button>
                {remoteApiAvailable && (
                  <Button
                    variant="outline"
                    onClick={() => window.location.href = '/api/hue/remote/authorize'}
                  >
                    ☁️ Cloud
                  </Button>
                )}
                <Button variant="ghost" onClick={handleCancelPairing}>
                  Annulla
                </Button>
              </div>
            </div>
          )}

          {/* Pairing in progress */}
          {pairing && pairingStep === 'pairing' && (
            <Banner
              variant="info"
              icon="🔗"
              title={`Pairing in corso... (${pairingCountdown}s)`}
              description="Attendi mentre mi connetto al bridge..."
              className="mb-4"
            />
          )}

          {/* Success */}
          {pairing && pairingStep === 'success' && (
            <Banner
              variant="success"
              icon="✅"
              title="Pairing completato!"
              description="Bridge Hue connesso con successo."
              className="mb-4"
            />
          )}

          {/* Initial state - not pairing, not needsRemotePairing */}
          {!pairing && !needsRemotePairing && (
            <>
              <Text variant="secondary" className="mb-6">
                Connetti il bridge Hue per controllare le luci. Scegli la modalità di connessione:
              </Text>

              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <Button variant="ember" onClick={handleStartPairing}>
                  📡 Connetti Locale
                </Button>
                {remoteApiAvailable && (
                  <Button
                    variant="outline"
                    onClick={() => window.location.href = '/api/hue/remote/authorize'}
                  >
                    ☁️ Connetti via Cloud
                  </Button>
                )}
              </div>

              <Divider className="my-4" />

              <Text variant="tertiary" size="sm">
                <strong>Locale:</strong> Richiede di essere sulla stessa rete WiFi del bridge.<br />
                {remoteApiAvailable && (
                  <><strong>Cloud:</strong> Funziona da qualsiasi luogo tramite account Philips Hue.</>
                )}
              </Text>
            </>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            onClick={() => router.push('/')}
            size="sm"
          >
            ← Indietro
          </Button>
          <Button
            variant="ghost"
            onClick={handleDisconnect}
            size="sm"
            disabled={refreshing}
          >
            🔌 Disconnetti
          </Button>
        </div>

        <Heading level={1} size="2xl" className="mb-2">
          Controllo Luci Philips Hue
        </Heading>
        <Text variant="secondary">
          Gestisci stanze, luci individuali e scene
        </Text>
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

      {/* Quick All-House Control */}
      {lights.length > 0 && (() => {
        const totalLightsOn = lights.filter(l => l.on?.on).length;
        const allHouseLightsOn = totalLightsOn === lights.length;
        const allHouseLightsOff = totalLightsOn === 0;

        return (
          <Card className="p-6 mb-6 bg-gradient-to-br from-slate-800/40 to-slate-900/60 border-slate-700/50 [html:not(.dark)_&]:from-slate-50 [html:not(.dark)_&]:to-slate-100 [html:not(.dark)_&]:border-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🏠</span>
                <div>
                  <Heading level={2} size="md">Tutta la Casa</Heading>
                  <Text variant="secondary" size="sm">
                    {totalLightsOn}/{lights.length} luci accese
                  </Text>
                </div>
              </div>

              <div className="flex gap-3">
                {/* Mixed state: show both buttons */}
                {!allHouseLightsOn && !allHouseLightsOff && (
                  <>
                    <Button
                      variant="ember"
                      onClick={() => handleAllLightsToggle(true)}
                      disabled={refreshing}
                      icon="💡"
                    >
                      Accendi Tutte
                    </Button>
                    <Button
                      variant="subtle"
                      onClick={() => handleAllLightsToggle(false)}
                      disabled={refreshing}
                      icon="🌙"
                    >
                      Spegni Tutte
                    </Button>
                  </>
                )}

                {/* All off: show only "Accendi" */}
                {allHouseLightsOff && (
                  <Button
                    variant="ember"
                    onClick={() => handleAllLightsToggle(true)}
                    disabled={refreshing}
                    icon="💡"
                    className="ring-2 ring-ember-500/30 ring-offset-2 ring-offset-slate-900 [html:not(.dark)_&]:ring-offset-white"
                  >
                    Accendi Tutte le Luci
                  </Button>
                )}

                {/* All on: show only "Spegni" */}
                {allHouseLightsOn && (
                  <Button
                    variant="subtle"
                    onClick={() => handleAllLightsToggle(false)}
                    disabled={refreshing}
                    icon="🌙"
                  >
                    Spegni Tutte le Luci
                  </Button>
                )}
              </div>
            </div>
          </Card>
        );
      })()}

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

            // Calculate lights state for smart button display
            const lightsOnCount = roomLights.filter(l => l.on?.on).length;
            const lightsOffCount = roomLights.length - lightsOnCount;
            const allLightsOn = roomLights.length > 0 && lightsOnCount === roomLights.length;
            const allLightsOff = roomLights.length > 0 && lightsOffCount === roomLights.length;

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
                        {roomLights.length > 0 && ` • ${lightsOnCount} accese`}
                      </Text>
                    </div>
                    {isOn && (
                      <Badge variant="ember" pulse>ACCESO</Badge>
                    )}
                  </div>

                  {/* Room Controls - Show only relevant button(s) */}
                  <div className="mb-4">
                    {/* Mixed state: show both buttons */}
                    {!allLightsOn && !allLightsOff && (
                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          variant="subtle"
                          onClick={() => handleRoomToggle(groupedLightId, true)}
                          disabled={refreshing || !groupedLightId}
                          size="sm"
                          icon="💡"
                        >
                          Accendi Stanza
                        </Button>
                        <Button
                          variant="subtle"
                          onClick={() => handleRoomToggle(groupedLightId, false)}
                          disabled={refreshing || !groupedLightId}
                          size="sm"
                          icon="🌙"
                        >
                          Spegni Stanza
                        </Button>
                      </div>
                    )}

                    {/* All lights off: show only "Accendi" */}
                    {allLightsOff && (
                      <Button
                        variant="ember"
                        onClick={() => handleRoomToggle(groupedLightId, true)}
                        disabled={refreshing || !groupedLightId}
                        size="sm"
                        icon="💡"
                        fullWidth
                        className="ring-2 ring-ember-500/30 ring-offset-2 ring-offset-white dark:ring-offset-slate-900"
                      >
                        Accendi Stanza
                      </Button>
                    )}

                    {/* All lights on: show only "Spegni" */}
                    {allLightsOn && (
                      <Button
                        variant="subtle"
                        onClick={() => handleRoomToggle(groupedLightId, false)}
                        disabled={refreshing || !groupedLightId}
                        size="sm"
                        icon="🌙"
                        fullWidth
                      >
                        Spegni Stanza
                      </Button>
                    )}
                  </div>

                  {/* Room Brightness */}
                  {isOn && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Text variant="secondary" size="xs">Luminosità Stanza</Text>
                        <Text variant="body" size="sm">{avgBrightness}%</Text>
                      </div>
                      <Slider
                        value={avgBrightness}
                        min={1}
                        max={100}
                        step={1}
                        onChange={(value) => handleBrightnessChange(groupedLightId, value)}
                        disabled={refreshing || !groupedLightId}
                        aria-label={`Luminosita stanza ${room.metadata?.name}`}
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
                  <div className="p-6 border-t border-slate-700 bg-slate-900/20 [html:not(.dark)_&]:border-slate-200 [html:not(.dark)_&]:bg-slate-50">
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
                                className={cn(
                                  "p-4 rounded-xl border-2 transition-colors",
                                  lightOn
                                    ? "border-warning-500/50 bg-warning-500/10"
                                    : "border-slate-700 bg-slate-800 [html:not(.dark)_&]:border-slate-200 [html:not(.dark)_&]:bg-white"
                                )}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div>
                                    <Text size="sm">{light.metadata?.name || 'Luce'}</Text>
                                    {hasColor && <Text variant="tertiary" size="xs">🎨 Colore disponibile</Text>}
                                  </div>
                                  {lightOn && <Badge variant="ember" size="sm">ON</Badge>}
                                </div>

                                {/* Show only relevant button */}
                                <div className="mb-2">
                                  {lightOn ? (
                                    <Button
                                      variant="subtle"
                                      onClick={() => handleLightToggle(light.id, false)}
                                      disabled={refreshing}
                                      size="sm"
                                      fullWidth
                                      icon="🌙"
                                    >
                                      Spegni
                                    </Button>
                                  ) : (
                                    <Button
                                      variant="ember"
                                      onClick={() => handleLightToggle(light.id, true)}
                                      disabled={refreshing}
                                      size="sm"
                                      fullWidth
                                      icon="💡"
                                    >
                                      Accendi
                                    </Button>
                                  )}
                                </div>

                                {lightOn && (
                                  <div className="space-y-3">
                                    {/* Brightness Control */}
                                    <div className="space-y-1">
                                      <div className="flex items-center justify-between">
                                        <Text variant="tertiary" size="xs">Luminosità</Text>
                                        <Text size="xs">{Math.round(lightBrightness)}%</Text>
                                      </div>
                                      <Slider
                                        value={lightBrightness}
                                        min={1}
                                        max={100}
                                        step={1}
                                        onChange={(value) => handleLightBrightnessChange(light.id, value)}
                                        disabled={refreshing}
                                        aria-label={`Luminosita ${light.metadata?.name}`}
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
                                              className="relative w-full aspect-square rounded-lg border-2 border-slate-600 hover:border-slate-400 transition-all active:scale-95 disabled:opacity-50 [html:not(.dark)_&]:border-slate-300 [html:not(.dark)_&]:hover:border-slate-500"
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
                              className={cn(
                                "relative p-4 rounded-xl border-2 transition-all active:scale-95",
                                activatingScene === scene.id
                                  ? "border-warning-500 bg-warning-500/10"
                                  : "border-slate-700 hover:border-warning-500/50 [html:not(.dark)_&]:border-slate-200 [html:not(.dark)_&]:hover:border-warning-400"
                              )}
                            >
                              <div className="text-2xl mb-1">🎨</div>
                              <Text size="xs" className="text-center">
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
