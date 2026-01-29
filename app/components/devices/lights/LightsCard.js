'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Skeleton from '../../ui/Skeleton';
import DeviceCard from '../../ui/DeviceCard';
import RoomSelector from '../../ui/RoomSelector';
import { Divider, Heading, Button, ControlButton, EmptyState, Text } from '../../ui';
import { supportsColor, getCurrentColorHex } from '@/lib/hue/colorUtils';

/**
 * LightsCard - Complete Philips Hue lights control for homepage
 * Summary view with quick room controls
 */
export default function LightsCard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);
  const [connectionMode, setConnectionMode] = useState(null); // 'local' | 'remote' | 'hybrid' | 'disconnected'
  const [remoteConnected, setRemoteConnected] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [lights, setLights] = useState([]);
  const [scenes, setScenes] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Loading overlay message
  const [loadingMessage, setLoadingMessage] = useState('Caricamento...');

  // Local slider value for smooth dragging (avoid API calls during drag)
  const [localBrightness, setLocalBrightness] = useState(null);
  const isDraggingSlider = useRef(false);

  // Pairing state
  const [pairing, setPairing] = useState(false);
  const [pairingStep, setPairingStep] = useState(null); // 'discovering' | 'waitingForButtonPress' | 'pairing' | 'success'
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

  // Use 'children' to get individual lights for this room
  // In Hue API v2 (Local): children contains device IDs, light.owner.rid points to device
  // In Hue API v2 (Remote normalized): children may contain light IDs directly
  const roomLights = lights.filter(light =>
    selectedRoom?.children?.some(c =>
      c.rid === light.id || // Remote API: light ID in children
      c.rid === light.owner?.rid // Local API: device ID in children, match via owner
    )
  );
  const roomScenes = scenes.filter(scene =>
    scene.group?.rid === selectedRoom?.id
  );

  // Check if room has any color-capable lights
  const hasColorLights = roomLights.some(light => supportsColor(light));

  // Get lights associated with the room via services (more reliable than children)
  // This matches how isRoomOn calculates state
  const serviceLights = selectedRoom?.services
    ?.map(s => lights.find(l => l.id === s.rid))
    .filter(Boolean) || [];

  // Use serviceLights if roomLights is empty (API inconsistency between children/services)
  const effectiveLights = roomLights.length > 0 ? roomLights : serviceLights;

  // Calculate lights on/off state for better UX
  const lightsOnCount = effectiveLights.filter(light => light?.on?.on).length;
  const lightsOffCount = effectiveLights.length - lightsOnCount;
  const allLightsOn = effectiveLights.length > 0 && lightsOnCount === effectiveLights.length;
  const allLightsOff = effectiveLights.length > 0 && lightsOffCount === effectiveLights.length;

  async function checkConnection() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/hue/status');
      const data = await response.json();

      if (data.connected) {
        setConnected(true);
        setConnectionMode(data.connection_mode || 'local');
        setRemoteConnected(data.remote_connected || false);
      } else {
        setConnected(false);
        setConnectionMode('disconnected');
        setRemoteConnected(false);
      }
    } catch (err) {
      console.error('Errore connessione Hue:', err);
      setConnected(false);
      setConnectionMode('disconnected');
      setRemoteConnected(false);
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

  /**
   * Toggle all lights in the house (all rooms at once)
   */
  async function handleAllLightsToggle(on) {
    try {
      setLoadingMessage(on ? 'Accensione tutte le luci...' : 'Spegnimento tutte le luci...');
      setRefreshing(true);
      setError(null);

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

      // Refresh data after all commands
      await fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setRefreshing(false);
    }
  }

  /**
   * Remote API OAuth Flow
   * Redirects to /api/hue/remote/authorize which handles OAuth
   */
  function handleRemoteAuth() {
    setPairingError(null);
    setError(null);
    // Redirect to our authorize endpoint (it will handle OAuth redirect to Philips)
    window.location.href = '/api/hue/remote/authorize';
  }

  /**
   * Disconnect remote access
   */
  async function handleDisconnectRemote() {
    try {
      setRefreshing(true);
      setError(null);

      const response = await fetch('/api/hue/remote/disconnect', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Refresh connection status
      await checkConnection();
    } catch (err) {
      console.error('Disconnect error:', err);
      setError(err.message);
    } finally {
      setRefreshing(false);
    }
  }

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

      // Check for HTTP errors before parsing JSON
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Errore HTTP ${response.status}`;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch {
          // Could not parse JSON, use status-based message
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
        // No local bridges found - offer remote option
        setPairingStep('noLocalBridge');
        return;
      }

      setDiscoveredBridges(data.bridges);

      // Auto-select if only one bridge, show instructions
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
   * User confirms they pressed the bridge button - start actual pairing
   */
  function handleConfirmButtonPressed() {
    if (selectedBridge) {
      handlePairWithBridge(selectedBridge);
    }
  }

  /**
   * Handle bridge selection from multiple bridges
   */
  function handleSelectBridge(bridge) {
    setSelectedBridge(bridge);
    setPairingStep('waitingForButtonPress');
  }

  /**
   * Retry pairing
   */
  function handleRetryPairing() {
    if (selectedBridge) {
      // Go back to waiting for button press step
      setPairingError(null);
      setPairingStep('waitingForButtonPress');
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

  // No local bridge found - offer remote option
  if (pairing && pairingStep === 'noLocalBridge') {
    banners.push({
      variant: 'info',
      icon: '☁️',
      title: 'Bridge non trovato sulla rete locale',
      description: 'Sei da remoto o il bridge non è sulla stessa rete Wi-Fi. Puoi connetterti via cloud con Philips Hue Remote API.',
      actions: [
        { label: '☁️ Connetti via Cloud', onClick: handleRemoteAuth, variant: 'primary' },
        { label: 'Annulla', onClick: handleCancelPairing }
      ]
    });
  }

  // Waiting for user to press bridge button - INSTRUCTION STEP
  if (pairing && pairingStep === 'waitingForButtonPress') {
    const remoteApiAvailable = !!process.env.NEXT_PUBLIC_HUE_CLIENT_ID;
    banners.push({
      variant: 'warning',
      icon: '👆',
      title: 'Premi il pulsante sul Bridge Hue',
      description: `Bridge trovato: ${selectedBridge?.internalipaddress || 'N/A'}. Premi il pulsante rotondo al centro del bridge, poi clicca "Avvia Pairing".${remoteApiAvailable ? ' Oppure connettiti via Cloud.' : ''}`,
      actions: [
        { label: '✓ Avvia Pairing', onClick: handleConfirmButtonPressed, variant: 'primary' },
        ...(remoteApiAvailable ? [{ label: '☁️ Cloud', onClick: handleRemoteAuth }] : []),
        { label: 'Annulla', onClick: handleCancelPairing }
      ]
    });
  }

  // Bridge selection (multiple bridges found)
  if (pairing && pairingStep === 'selectBridge' && discoveredBridges.length > 1) {
    banners.push({
      variant: 'info',
      icon: '🔗',
      title: 'Seleziona Bridge',
      description: `Trovati ${discoveredBridges.length} bridge sulla rete. Seleziona quello da connettere.`,
      actions: discoveredBridges.map(bridge => ({
        label: `${bridge.internalipaddress}`,
        onClick: () => handleSelectBridge(bridge),
        variant: selectedBridge?.id === bridge.id ? 'primary' : 'outline'
      })).concat([
        { label: 'Annulla', onClick: handleCancelPairing }
      ])
    });
  }

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

  // Pairing error - offer Cloud option if available
  if (pairingError) {
    const remoteApiAvailable = !!process.env.NEXT_PUBLIC_HUE_CLIENT_ID;
    const isNetworkError = pairingError.includes('timeout') ||
                           pairingError.includes('TIMEOUT') ||
                           pairingError.includes('network') ||
                           pairingError.includes('raggiungibile');

    banners.push({
      variant: 'error',
      icon: '⚠️',
      title: 'Errore Pairing',
      description: isNetworkError && remoteApiAvailable
        ? `${pairingError}. Sei da remoto? Prova a connetterti via Cloud.`
        : pairingError,
      dismissible: true,
      onDismiss: () => setPairingError(null),
      actions: [
        ...(isNetworkError && remoteApiAvailable
          ? [{ label: '☁️ Connetti via Cloud', onClick: handleRemoteAuth, variant: 'primary' }]
          : [{ label: 'Riprova', onClick: handleRetryPairing }]
        ),
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

  // Connection mode badge for DeviceCard header
  const getStatusBadge = () => {
    if (!connected || !connectionMode) return null;

    const badges = {
      'local': { icon: '📡', label: 'Local', color: 'sage' },
      'remote': { icon: '☁️', label: 'Cloud', color: 'ocean' },
      'hybrid': { icon: '🔄', label: 'Hybrid', color: 'warning' },
    };

    return badges[connectionMode] || null;
  };

  const isRoomOn = selectedRoom?.services?.some(s => {
    const light = lights.find(l => l.id === s.rid);
    return light?.on?.on;
  }) || false;

  // Calculate total house lights state for quick control
  const totalLightsOn = lights.filter(l => l.on?.on).length;
  const totalLightsOff = lights.length - totalLightsOn;
  const allHouseLightsOn = lights.length > 0 && totalLightsOn === lights.length;
  const allHouseLightsOff = lights.length > 0 && totalLightsOff === lights.length;
  const hasAnyLights = lights.length > 0;

  const avgBrightness = selectedRoom && effectiveLights.length > 0 ? Math.round(
    effectiveLights.reduce((sum, l) => sum + (l.dimming?.brightness || 0), 0) / effectiveLights.length
  ) : 0;

  // Calculate perceived luminance of a hex color (0 = dark, 1 = bright)
  const getLuminance = (hex) => {
    const rgb = hex.replace('#', '').match(/.{2}/g)?.map(x => parseInt(x, 16) / 255) || [0, 0, 0];
    const [r, g, b] = rgb.map(c => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  // Determine if text should be light or dark based on background colors
  const getContrastMode = (colors, brightness) => {
    if (colors.length === 0) return 'default';

    // Calculate average luminance of all colors
    const avgLuminance = colors.reduce((sum, color) => sum + getLuminance(color), 0) / colors.length;

    // Factor in brightness (higher brightness = lighter background)
    const effectiveLuminance = avgLuminance * (brightness / 100);

    // Return 'light' if background is bright (need dark text), 'dark' if background is dark (need light text)
    return effectiveLuminance > 0.25 ? 'light' : 'dark';
  };

  // Calculate colors of ON lights for dynamic styling
  const getRoomLightColors = () => {
    const onLights = effectiveLights.filter(light => light?.on?.on);
    if (onLights.length === 0) return { colors: [], avgBrightness: 0 };

    const colors = onLights
      .map(light => {
        const hex = getCurrentColorHex(light);
        // If no color (white/CT only), use warm white
        return hex || '#FFE4B5';
      })
      .filter(Boolean);

    // Remove duplicates
    const uniqueColors = [...new Set(colors)];

    // Calculate average brightness of ON lights only
    const onBrightness = Math.round(
      onLights.reduce((sum, l) => sum + (l.dimming?.brightness || 100), 0) / onLights.length
    );

    return { colors: uniqueColors, avgBrightness: onBrightness };
  };

  const { colors: roomColors, avgBrightness: roomOnBrightness } = getRoomLightColors();

  // Generate dynamic style based on room light colors
  const getRoomControlStyle = () => {
    if (!isRoomOn || roomColors.length === 0) {
      return null; // Use default static styles
    }

    // Opacity based on brightness (0.15 to 0.5 range)
    const baseOpacity = 0.15 + (roomOnBrightness / 100) * 0.35;
    const borderOpacity = 0.3 + (roomOnBrightness / 100) * 0.4;

    if (roomColors.length === 1) {
      // Single color - solid gradient
      return {
        background: `linear-gradient(135deg, ${roomColors[0]}${Math.round(baseOpacity * 255).toString(16).padStart(2, '0')} 0%, rgba(15, 23, 42, 0.6) 50%, ${roomColors[0]}${Math.round(baseOpacity * 0.5 * 255).toString(16).padStart(2, '0')} 100%)`,
        borderColor: `${roomColors[0]}${Math.round(borderOpacity * 255).toString(16).padStart(2, '0')}`,
        boxShadow: `0 0 ${20 + roomOnBrightness * 0.3}px ${roomColors[0]}${Math.round(baseOpacity * 0.6 * 255).toString(16).padStart(2, '0')}`,
      };
    }

    // Multiple colors - create gradient with all colors
    const gradientStops = roomColors.map((color, i) => {
      const position = (i / (roomColors.length - 1)) * 100;
      return `${color}${Math.round(baseOpacity * 255).toString(16).padStart(2, '0')} ${position}%`;
    }).join(', ');

    // Use first and last colors for border glow effect
    const primaryColor = roomColors[0];
    const secondaryColor = roomColors[roomColors.length - 1];

    return {
      background: `linear-gradient(135deg, ${gradientStops})`,
      borderColor: `${primaryColor}${Math.round(borderOpacity * 255).toString(16).padStart(2, '0')}`,
      boxShadow: `0 0 ${15 + roomOnBrightness * 0.2}px ${primaryColor}${Math.round(baseOpacity * 0.4 * 255).toString(16).padStart(2, '0')}, 0 0 ${25 + roomOnBrightness * 0.3}px ${secondaryColor}${Math.round(baseOpacity * 0.3 * 255).toString(16).padStart(2, '0')}`,
    };
  };

  const dynamicRoomStyle = getRoomControlStyle();

  // Determine contrast mode for adaptive UI
  const contrastMode = dynamicRoomStyle ? getContrastMode(roomColors, roomOnBrightness) : 'default';

  // Adaptive UI classes based on background contrast
  // Following Ember Noir design system - use standard button variants
  const adaptiveClasses = {
    // For bright backgrounds (yellow, white, etc.) - use dark UI elements
    light: {
      heading: 'text-slate-900',
      text: 'text-slate-700',
      textSecondary: 'text-slate-600',
      badge: 'bg-slate-900/90 text-white',
      badgeGlow: 'bg-slate-900/40',
      statusOn: 'bg-slate-900/70 text-white border border-slate-700',
      statusOff: 'bg-white/60 text-slate-800 border border-slate-300',
      // Use outline variant for visibility on bright backgrounds
      buttonVariant: 'outline',
      buttonClass: '!bg-slate-900/90 !text-white !border-slate-700 hover:!bg-slate-800',
      slider: 'bg-slate-300 accent-slate-800',
      brightnessPanel: 'bg-white/60 border border-slate-200/80',
      brightnessValue: 'text-slate-900',
    },
    // For dark backgrounds (blue, purple, etc.) - use light UI elements
    dark: {
      heading: 'text-white',
      text: 'text-slate-100',
      textSecondary: 'text-slate-200',
      badge: 'bg-white/95 text-slate-900',
      badgeGlow: 'bg-white/50',
      statusOn: 'bg-white/80 text-slate-900 border border-white/60',
      statusOff: 'bg-slate-900/70 text-white border border-slate-500',
      // Use outline variant for visibility on dark backgrounds
      buttonVariant: 'outline',
      buttonClass: '!bg-white/90 !text-slate-900 !border-white/60 hover:!bg-white',
      slider: 'bg-slate-600 accent-white',
      brightnessPanel: 'bg-slate-900/60 border border-slate-500/80',
      brightnessValue: 'text-white',
    },
    // Default (no dynamic style) - use existing ember noir styling
    default: {
      heading: '',
      text: '',
      textSecondary: '',
      badge: '',
      badgeGlow: '',
      statusOn: '',
      statusOff: '',
      buttonVariant: null,
      buttonClass: '',
      slider: '',
      brightnessPanel: '',
      brightnessValue: '',
    },
  };

  const adaptive = adaptiveClasses[contrastMode];

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
      statusBadge={getStatusBadge()}
      banners={banners}
      infoBoxes={infoBoxes}
      infoBoxesTitle="Informazioni"
      footerActions={footerActions}
    >
      {/* Quick All-House Control */}
      {hasAnyLights && (
        <div className="mb-4 p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 [html:not(.dark)_&]:bg-slate-100/80 [html:not(.dark)_&]:border-slate-200">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xl">🏠</span>
              <div className="min-w-0">
                <Text size="sm" weight="semibold" className="font-display truncate">Tutta la Casa</Text>
                <Text variant="tertiary" size="xs">{totalLightsOn}/{lights.length} accese</Text>
              </div>
            </div>

            {/* Smart button based on state */}
            <div className="flex-shrink-0">
              {/* Mixed state: show both buttons compact */}
              {!allHouseLightsOn && !allHouseLightsOff && (
                <div className="flex gap-2">
                  <Button
                    variant="subtle"
                    onClick={() => handleAllLightsToggle(true)}
                    disabled={refreshing}
                    size="sm"
                    icon="💡"
                  >
                    Tutte
                  </Button>
                  <Button
                    variant="subtle"
                    onClick={() => handleAllLightsToggle(false)}
                    disabled={refreshing}
                    size="sm"
                    icon="🌙"
                  >
                    Spegni
                  </Button>
                </div>
              )}

              {/* All off: show only "Accendi" */}
              {allHouseLightsOff && (
                <Button
                  variant="ember"
                  onClick={() => handleAllLightsToggle(true)}
                  disabled={refreshing}
                  size="sm"
                  icon="💡"
                >
                  Accendi Tutte
                </Button>
              )}

              {/* All on: show only "Spegni" */}
              {allHouseLightsOn && (
                <Button
                  variant="subtle"
                  onClick={() => handleAllLightsToggle(false)}
                  disabled={refreshing}
                  size="sm"
                  icon="🌙"
                >
                  Spegni Tutte
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

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
                {/* Main Control Area - Dynamic colors based on room lights */}
                <div
                  className={`relative rounded-2xl p-6 sm:p-8 transition-all duration-500 border ${
                    !dynamicRoomStyle ? (
                      isRoomOn
                        ? 'bg-gradient-to-br from-warning-900/40 via-slate-900/60 to-ember-900/30 border-warning-500/40 shadow-[0_0_30px_rgba(234,179,8,0.2)] [html:not(.dark)_&]:from-warning-100/80 [html:not(.dark)_&]:via-warning-50/90 [html:not(.dark)_&]:to-ember-100/70 [html:not(.dark)_&]:border-warning-300 [html:not(.dark)_&]:shadow-[0_0_20px_rgba(234,179,8,0.15)]'
                        : 'bg-gradient-to-br from-slate-800/60 via-slate-900/70 to-slate-800/50 border-slate-600/40 [html:not(.dark)_&]:from-slate-100/80 [html:not(.dark)_&]:via-white/90 [html:not(.dark)_&]:to-slate-100/70 [html:not(.dark)_&]:border-slate-200'
                    ) : ''
                  }`}
                  style={dynamicRoomStyle || {}}
                >
                  {/* ON Badge - adaptive to background */}
                  {isRoomOn && (
                    <div className="absolute -top-2 -right-2 z-20">
                      <div className="relative">
                        <div className={`absolute inset-0 rounded-full blur-lg animate-pulse ${
                          adaptive.badgeGlow || 'bg-warning-500/30 [html:not(.dark)_&]:bg-warning-400/40'
                        }`}></div>
                        <div className={`relative px-3 py-1.5 rounded-full shadow-lg ring-2 ${
                          adaptive.badge
                            ? `${adaptive.badge} ring-current/30`
                            : 'bg-gradient-to-br from-warning-500 to-warning-600 text-white ring-slate-900/50 [html:not(.dark)_&]:ring-white/50'
                        }`}>
                          <span className="text-xs font-bold font-display">💡 ACCESO</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Room name (solo se c'è una sola stanza) */}
                  {roomLights.length === 1 && (
                    <div className="text-center mb-6">
                      <Heading level={3} size="sm" variant={adaptive.heading ? 'default' : 'subtle'} className={`uppercase tracking-wider font-display ${adaptive.heading}`}>
                        {selectedRoom.metadata?.name || 'Stanza'}
                      </Heading>
                    </div>
                  )}

                  {/* Lights Status Summary */}
                  {roomLights.length > 1 && (
                    <div className="flex justify-center gap-4 mb-4 text-xs font-display">
                      <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${
                        adaptive.statusOn
                          ? adaptive.statusOn
                          : (lightsOnCount > 0
                            ? 'bg-warning-900/40 text-warning-400 border-warning-500/30 [html:not(.dark)_&]:bg-warning-100/80 [html:not(.dark)_&]:text-warning-700 [html:not(.dark)_&]:border-warning-300'
                            : 'bg-slate-800/50 text-slate-500 border-slate-700/30 [html:not(.dark)_&]:bg-slate-100 [html:not(.dark)_&]:text-slate-500 [html:not(.dark)_&]:border-slate-200')
                      }`}>
                        <span>💡</span>
                        <span className="font-semibold">{lightsOnCount} accese</span>
                      </span>
                      <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${
                        adaptive.statusOff
                          ? adaptive.statusOff
                          : (lightsOffCount > 0
                            ? 'bg-slate-800/50 text-slate-400 border-slate-700/30 [html:not(.dark)_&]:bg-slate-100 [html:not(.dark)_&]:text-slate-600 [html:not(.dark)_&]:border-slate-200'
                            : 'bg-slate-800/30 text-slate-600 border-slate-700/20 [html:not(.dark)_&]:bg-slate-50 [html:not(.dark)_&]:text-slate-400 [html:not(.dark)_&]:border-slate-100')
                      }`}>
                        <span>🌙</span>
                        <span className="font-semibold">{lightsOffCount} spente</span>
                      </span>
                    </div>
                  )}

                  {/* On/Off Button - Show only the relevant action */}
                  <div className="mb-6">
                    {/* Mixed state: show both buttons */}
                    {!allLightsOn && !allLightsOff && (
                      <div className="grid grid-cols-2 gap-4">
                        <Button
                          variant={adaptive.buttonVariant || 'subtle'}
                          onClick={() => handleRoomToggle(selectedRoomGroupedLightId, true)}
                          disabled={refreshing || !selectedRoomGroupedLightId}
                          icon="💡"
                          size="lg"
                          className={`h-16 sm:h-20 font-display ${adaptive.buttonClass}`}
                        >
                          Accendi tutte
                        </Button>
                        <Button
                          variant={adaptive.buttonVariant || 'subtle'}
                          onClick={() => handleRoomToggle(selectedRoomGroupedLightId, false)}
                          disabled={refreshing || !selectedRoomGroupedLightId}
                          icon="🌙"
                          size="lg"
                          className={`h-16 sm:h-20 font-display ${adaptive.buttonClass}`}
                        >
                          Spegni tutte
                        </Button>
                      </div>
                    )}

                    {/* All lights off: show only "Accendi" - prominent CTA */}
                    {allLightsOff && (
                      <Button
                        variant={adaptive.buttonVariant || 'ember'}
                        onClick={() => handleRoomToggle(selectedRoomGroupedLightId, true)}
                        disabled={refreshing || !selectedRoomGroupedLightId}
                        icon="💡"
                        size="lg"
                        className={`w-full h-16 sm:h-20 font-display ${
                          adaptive.buttonClass
                            || 'ring-2 ring-ember-500/30 ring-offset-2 ring-offset-slate-900 [html:not(.dark)_&]:ring-offset-white'
                        }`}
                      >
                        Accendi
                      </Button>
                    )}

                    {/* All lights on: show only "Spegni" */}
                    {allLightsOn && (
                      <Button
                        variant={adaptive.buttonVariant || 'subtle'}
                        onClick={() => handleRoomToggle(selectedRoomGroupedLightId, false)}
                        disabled={refreshing || !selectedRoomGroupedLightId}
                        icon="🌙"
                        size="lg"
                        className={`w-full h-16 sm:h-20 font-display ${adaptive.buttonClass}`}
                      >
                        Spegni
                      </Button>
                    )}
                  </div>

                  {/* Brightness Control - Adaptive */}
                  {isRoomOn && (
                    <div className={`relative overflow-hidden rounded-2xl backdrop-blur-xl border p-4 sm:p-5 ${
                      adaptive.brightnessPanel
                        ? adaptive.brightnessPanel
                        : 'bg-slate-800/50 border-slate-700/50 [html:not(.dark)_&]:bg-white/80 [html:not(.dark)_&]:border-slate-200'
                    }`}>
                      <div className="relative z-10 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">☀️</span>
                            <Heading level={4} size="sm" variant={adaptive.heading ? 'default' : undefined} className={`font-display ${adaptive.heading}`}>Luminosità</Heading>
                          </div>
                          <span className={`text-2xl sm:text-3xl font-black font-display ${
                            adaptive.brightnessValue
                              ? adaptive.brightnessValue
                              : 'text-warning-400 [html:not(.dark)_&]:text-warning-600'
                          }`}>
                            {localBrightness !== null ? localBrightness : avgBrightness}%
                          </span>
                        </div>

                        {/* Slider - Adaptive styled with local state during drag */}
                        <input
                          type="range"
                          min="1"
                          max="100"
                          value={localBrightness !== null ? localBrightness : avgBrightness}
                          onMouseDown={() => { isDraggingSlider.current = true; }}
                          onTouchStart={() => { isDraggingSlider.current = true; }}
                          onInput={(e) => {
                            // Update local state immediately for smooth UI
                            setLocalBrightness(parseInt(e.target.value));
                          }}
                          onMouseUp={(e) => {
                            if (isDraggingSlider.current) {
                              isDraggingSlider.current = false;
                              handleBrightnessChange(selectedRoomGroupedLightId, e.target.value);
                              setLocalBrightness(null);
                            }
                          }}
                          onTouchEnd={(e) => {
                            if (isDraggingSlider.current) {
                              isDraggingSlider.current = false;
                              const value = localBrightness !== null ? localBrightness : avgBrightness;
                              handleBrightnessChange(selectedRoomGroupedLightId, value.toString());
                              setLocalBrightness(null);
                            }
                          }}
                          disabled={refreshing || !selectedRoomGroupedLightId}
                          className={`w-full h-3 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                            adaptive.slider
                              ? adaptive.slider
                              : 'bg-slate-700 accent-warning-500 [html:not(.dark)_&]:bg-slate-200'
                          }`}
                        />

                        {/* +/- Buttons */}
                        <div className="flex items-center gap-2">
                          <Button
                            variant={adaptive.buttonVariant || 'subtle'}
                            size="sm"
                            icon="➖"
                            onClick={() => {
                              const newValue = Math.max(1, avgBrightness - 5);
                              handleBrightnessChange(selectedRoomGroupedLightId, newValue.toString());
                            }}
                            disabled={refreshing || avgBrightness <= 1 || !selectedRoomGroupedLightId}
                            className={`flex-1 font-display ${adaptive.buttonClass}`}
                          >
                            -5%
                          </Button>
                          <Button
                            variant={adaptive.buttonVariant || 'subtle'}
                            size="sm"
                            icon="➕"
                            onClick={() => {
                              const newValue = Math.min(100, avgBrightness + 5);
                              handleBrightnessChange(selectedRoomGroupedLightId, newValue.toString());
                            }}
                            disabled={refreshing || avgBrightness >= 100 || !selectedRoomGroupedLightId}
                            className={`flex-1 font-display ${adaptive.buttonClass}`}
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
                        variant={adaptive.buttonVariant || 'subtle'}
                        size="sm"
                        icon="🎨"
                        onClick={() => router.push('/lights')}
                        className={`w-full font-display ${adaptive.buttonClass}`}
                      >
                        Controllo Colore
                      </Button>
                    </div>
                  )}
                </div>

                {/* Scenes - Horizontal Scroll - Ember Noir */}
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
                            className="flex-shrink-0 w-32 sm:w-36 p-4 rounded-xl border bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-warning-900/30 hover:border-warning-500/40 hover:text-warning-300 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed snap-start font-display [html:not(.dark)_&]:bg-white/80 [html:not(.dark)_&]:border-slate-200 [html:not(.dark)_&]:text-slate-600 [html:not(.dark)_&]:hover:bg-warning-100/80 [html:not(.dark)_&]:hover:border-warning-300 [html:not(.dark)_&]:hover:text-warning-700"
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
                          <Text variant="tertiary" size="xs">
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
