/**
 * useLightsData Hook
 *
 * Encapsulates all Philips Hue lights state management:
 * - Polling via useAdaptivePolling (30s interval)
 * - Connection checking (local/remote/hybrid modes)
 * - Data fetching (rooms, lights, scenes)
 * - Pairing flow state
 * - Derived state computation
 * - Dynamic styling based on room light colors
 *
 * This hook guarantees SINGLE polling loop for LightsCard.
 */

'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useAdaptivePolling } from '@/lib/hooks/useAdaptivePolling';
import { supportsColor, getCurrentColorHex } from '@/lib/hue/colorUtils';

/**
 * Adaptive classes for UI based on background contrast
 */
export interface AdaptiveClasses {
  heading: string;
  text: string;
  textSecondary: string;
  badge: string;
  badgeGlow: string;
  statusOn: string;
  statusOff: string;
  buttonVariant: 'outline' | null;
  buttonClass: string;
  slider: string;
  brightnessPanel: string;
  brightnessValue: string;
}

/**
 * All state and functions exposed by useLightsData
 */
export interface UseLightsDataReturn {
  // Core state
  loading: boolean;
  error: string | null;
  connected: boolean;
  connectionMode: 'local' | 'remote' | 'hybrid' | 'disconnected' | null;
  remoteConnected: boolean;
  rooms: any[];
  lights: any[];
  scenes: any[];
  selectedRoomId: string | null;
  refreshing: boolean;
  loadingMessage: string;
  localBrightness: number | null;

  // Pairing state
  pairing: boolean;
  pairingStep: 'discovering' | 'waitingForButtonPress' | 'pairing' | 'success' | 'noLocalBridge' | 'selectBridge' | null;
  discoveredBridges: any[];
  selectedBridge: any;
  pairingCountdown: number;
  pairingError: string | null;

  // Derived state (computed from rooms/lights/scenes)
  selectedRoom: any;
  selectedRoomGroupedLightId: string | null;
  roomLights: any[];
  roomScenes: any[];
  effectiveLights: any[];
  hasColorLights: boolean;
  lightsOnCount: number;
  lightsOffCount: number;
  allLightsOn: boolean;
  allLightsOff: boolean;
  isRoomOn: boolean;
  totalLightsOn: number;
  totalLightsOff: number;
  allHouseLightsOn: boolean;
  allHouseLightsOff: boolean;
  hasAnyLights: boolean;
  avgBrightness: number;

  // Dynamic styling state
  roomColors: string[];
  roomOnBrightness: number;
  dynamicRoomStyle: Record<string, string> | null;
  contrastMode: 'light' | 'dark' | 'default';
  adaptive: AdaptiveClasses;

  // Actions
  setSelectedRoomId: (id: string | null) => void;
  setLocalBrightness: (val: number | null) => void;
  setError: (err: string | null) => void;
  setPairingError: (err: string | null) => void;
  setRefreshing: (val: boolean) => void;
  setLoadingMessage: (msg: string) => void;
  checkConnection: () => Promise<void>;
  fetchData: () => Promise<void>;
  handleRefresh: () => Promise<void>;

  // Pairing state setters (needed by commands hook)
  setPairing: (val: boolean) => void;
  setPairingStep: (step: UseLightsDataReturn['pairingStep']) => void;
  setDiscoveredBridges: (bridges: any[]) => void;
  setSelectedBridge: (bridge: any) => void;
  setPairingCountdown: (val: number) => void;
  pairingTimerRef: React.MutableRefObject<NodeJS.Timeout | null>;
}

/**
 * Custom hook for lights data management
 *
 * @returns All lights state and actions
 */
export function useLightsData(): UseLightsDataReturn {
  // Core state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [connectionMode, setConnectionMode] = useState<'local' | 'remote' | 'hybrid' | 'disconnected' | null>(null);
  const [remoteConnected, setRemoteConnected] = useState(false);
  const [rooms, setRooms] = useState<any[]>([]);
  const [lights, setLights] = useState<any[]>([]);
  const [scenes, setScenes] = useState<any[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Caricamento...');
  const [localBrightness, setLocalBrightness] = useState<number | null>(null);

  // Pairing state
  const [pairing, setPairing] = useState(false);
  const [pairingStep, setPairingStep] = useState<'discovering' | 'waitingForButtonPress' | 'pairing' | 'success' | 'noLocalBridge' | 'selectBridge' | null>(null);
  const [discoveredBridges, setDiscoveredBridges] = useState<any[]>([]);
  const [selectedBridge, setSelectedBridge] = useState<any>(null);
  const [pairingCountdown, setPairingCountdown] = useState(30);
  const [pairingError, setPairingError] = useState<string | null>(null);

  // Refs
  const connectionCheckedRef = useRef(false);
  const pairingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Check connection on mount
  useEffect(() => {
    if (connectionCheckedRef.current) return;
    connectionCheckedRef.current = true;
    checkConnection();
  }, []);

  async function checkConnection() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/hue/status');
      const data = await response.json() as { connected?: boolean; connection_mode?: string; remote_connected?: boolean };

      if (data.connected) {
        setConnected(true);
        setConnectionMode((data.connection_mode as 'local' | 'remote' | 'hybrid' | 'disconnected') || 'local');
        setRemoteConnected(data.remote_connected || false);
      } else {
        setConnected(false);
        setConnectionMode('disconnected');
        setRemoteConnected(false);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('Errore connessione Hue:', err);
      setConnected(false);
      setConnectionMode('disconnected');
      setRemoteConnected(false);
      setError(message);
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
      ]) as [
        { rooms?: any[]; reconnect?: boolean; error?: string },
        { lights?: any[]; reconnect?: boolean; error?: string },
        { scenes?: any[]; reconnect?: boolean; error?: string }
      ];

      if (roomsData.reconnect || lightsData.reconnect || scenesData.reconnect) {
        setConnected(false);
        return;
      }

      if (roomsData.error) throw new Error(roomsData.error);
      if (lightsData.error) throw new Error(lightsData.error);
      if (scenesData.error) throw new Error(scenesData.error);

      // Sort rooms with 'Casa' first, then alphabetical
      const sortedRooms = (roomsData.rooms || []).sort((a: any, b: any) => {
        if (a.metadata?.name === 'Casa') return -1;
        if (b.metadata?.name === 'Casa') return 1;
        return (a.metadata?.name || '').localeCompare(b.metadata?.name || '');
      });
      setRooms(sortedRooms);
      setLights(lightsData.lights || []);
      setScenes(scenesData.scenes || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('Errore fetch dati Hue:', err);
      setError(message);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await checkConnection();
    if (connected) await fetchData();
    setRefreshing(false);
  }

  // Poll data every 30 seconds - pauses when tab hidden
  useAdaptivePolling({
    callback: fetchData,
    interval: connected ? 30000 : null, // Only poll when connected
    alwaysActive: false, // Non-critical: pause when hidden
    immediate: true,
  });

  // Auto-select first room
  useEffect(() => {
    if (rooms.length > 0 && !selectedRoomId) {
      setSelectedRoomId(rooms[0].id);
    }
  }, [rooms, selectedRoomId]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (pairingTimerRef.current) {
        clearInterval(pairingTimerRef.current);
      }
    };
  }, []);

  // Derived state computations
  const selectedRoom = useMemo(() => {
    return rooms.find(r => r.id === selectedRoomId) || rooms[0];
  }, [rooms, selectedRoomId]);

  // Extract grouped_light ID from room services
  const getGroupedLightId = (room: any): string | null => {
    if (!room?.services) return null;
    const groupedLight = room.services.find((s: any) => s.rtype === 'grouped_light');
    return groupedLight?.rid || null;
  };

  const selectedRoomGroupedLightId = useMemo(() => {
    return getGroupedLightId(selectedRoom);
  }, [selectedRoom]);

  // Use 'children' to get individual lights for this room
  const roomLights = useMemo(() => {
    return lights.filter((light: any) =>
      selectedRoom?.children?.some((c: any) =>
        c.rid === light.id || // Remote API: light ID in children
        c.rid === light.owner?.rid // Local API: device ID in children, match via owner
      )
    );
  }, [lights, selectedRoom]);

  const roomScenes = useMemo(() => {
    return scenes.filter((scene: any) =>
      scene.group?.rid === selectedRoom?.id
    );
  }, [scenes, selectedRoom]);

  // Check if room has any color-capable lights
  const hasColorLights = useMemo(() => {
    return roomLights.some((light: any) => supportsColor(light));
  }, [roomLights]);

  // Get lights associated with the room via services (more reliable than children)
  const serviceLights = useMemo(() => {
    return selectedRoom?.services
      ?.map((s: any) => lights.find((l: any) => l.id === s.rid))
      .filter(Boolean) || [];
  }, [selectedRoom, lights]);

  // Use serviceLights if roomLights is empty (API inconsistency between children/services)
  const effectiveLights = useMemo(() => {
    return roomLights.length > 0 ? roomLights : serviceLights;
  }, [roomLights, serviceLights]);

  // Calculate lights on/off state for better UX
  const lightsOnCount = useMemo(() => {
    return effectiveLights.filter((light: any) => light?.on?.on).length;
  }, [effectiveLights]);

  const lightsOffCount = useMemo(() => {
    return effectiveLights.length - lightsOnCount;
  }, [effectiveLights, lightsOnCount]);

  const allLightsOn = useMemo(() => {
    return effectiveLights.length > 0 && lightsOnCount === effectiveLights.length;
  }, [effectiveLights, lightsOnCount]);

  const allLightsOff = useMemo(() => {
    return effectiveLights.length > 0 && lightsOffCount === effectiveLights.length;
  }, [effectiveLights, lightsOffCount]);

  const isRoomOn = useMemo(() => {
    return selectedRoom?.services?.some((s: any) => {
      const light = lights.find((l: any) => l.id === s.rid);
      return light?.on?.on;
    }) || false;
  }, [selectedRoom, lights]);

  // Calculate total house lights state for quick control
  const totalLightsOn = useMemo(() => {
    return lights.filter((l: any) => l.on?.on).length;
  }, [lights]);

  const totalLightsOff = useMemo(() => {
    return lights.length - totalLightsOn;
  }, [lights, totalLightsOn]);

  const allHouseLightsOn = useMemo(() => {
    return lights.length > 0 && totalLightsOn === lights.length;
  }, [lights, totalLightsOn]);

  const allHouseLightsOff = useMemo(() => {
    return lights.length > 0 && totalLightsOff === lights.length;
  }, [lights, totalLightsOff]);

  const hasAnyLights = useMemo(() => {
    return lights.length > 0;
  }, [lights]);

  const avgBrightness = useMemo(() => {
    if (!selectedRoom || effectiveLights.length === 0) return 0;
    return Math.round(
      effectiveLights.reduce((sum: number, l: any) => sum + (l.dimming?.brightness || 0), 0) / effectiveLights.length
    );
  }, [selectedRoom, effectiveLights]);

  // Dynamic styling computations

  // Calculate perceived luminance of a hex color (0 = dark, 1 = bright)
  const getLuminance = (hex: string): number => {
    const rgb = hex.replace('#', '').match(/.{2}/g)?.map((x: string) => parseInt(x, 16) / 255) || [0, 0, 0];
    const [r = 0, g = 0, b = 0] = rgb.map((c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  // Determine if text should be light or dark based on background colors
  const getContrastMode = (colors: string[], brightness: number): 'light' | 'dark' | 'default' => {
    if (colors.length === 0) return 'default';

    // Calculate average luminance of all colors
    const avgLuminance = colors.reduce((sum: number, color: string) => sum + getLuminance(color), 0) / colors.length;

    // Factor in brightness (higher brightness = lighter background)
    const effectiveLuminance = avgLuminance * (brightness / 100);

    // Return 'light' if background is bright (need dark text), 'dark' if background is dark (need light text)
    return effectiveLuminance > 0.25 ? 'light' : 'dark';
  };

  // Calculate colors of ON lights for dynamic styling
  const getRoomLightColors = (): { colors: string[]; avgBrightness: number } => {
    const onLights = effectiveLights.filter((light: any) => light?.on?.on);
    if (onLights.length === 0) return { colors: [], avgBrightness: 0 };

    const colors = onLights
      .map((light: any) => {
        const hex = getCurrentColorHex(light);
        // If no color (white/CT only), use warm white
        return hex || '#FFE4B5';
      })
      .filter(Boolean) as string[];

    // Remove duplicates
    const uniqueColors = Array.from(new Set(colors));

    // Calculate average brightness of ON lights only
    const onBrightness = Math.round(
      onLights.reduce((sum: number, l: any) => sum + (l.dimming?.brightness || 100), 0) / onLights.length
    );

    return { colors: uniqueColors, avgBrightness: onBrightness };
  };

  const { colors: roomColors, avgBrightness: roomOnBrightness } = useMemo(() => {
    return getRoomLightColors();
  }, [effectiveLights]);

  // Generate dynamic style based on room light colors
  const getRoomControlStyle = (): Record<string, string> | null => {
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

  const dynamicRoomStyle = useMemo(() => {
    return getRoomControlStyle();
  }, [isRoomOn, roomColors, roomOnBrightness]);

  // Determine contrast mode for adaptive UI
  const contrastMode = useMemo(() => {
    return dynamicRoomStyle ? getContrastMode(roomColors, roomOnBrightness) : 'default';
  }, [dynamicRoomStyle, roomColors, roomOnBrightness]);

  // Adaptive UI classes based on background contrast
  const adaptiveClasses: Record<'light' | 'dark' | 'default', AdaptiveClasses> = {
    // For bright backgrounds (yellow, white, etc.) - use dark UI elements
    light: {
      heading: 'text-slate-900',
      text: 'text-slate-700',
      textSecondary: 'text-slate-600',
      badge: 'bg-slate-900/90 text-white',
      badgeGlow: 'bg-slate-900/40',
      statusOn: 'bg-slate-900/70 text-white border border-slate-700',
      statusOff: 'bg-white/60 text-slate-800 border border-slate-300',
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

  return {
    // Core state
    loading,
    error,
    connected,
    connectionMode,
    remoteConnected,
    rooms,
    lights,
    scenes,
    selectedRoomId,
    refreshing,
    loadingMessage,
    localBrightness,

    // Pairing state
    pairing,
    pairingStep,
    discoveredBridges,
    selectedBridge,
    pairingCountdown,
    pairingError,

    // Derived state
    selectedRoom,
    selectedRoomGroupedLightId,
    roomLights,
    roomScenes,
    effectiveLights,
    hasColorLights,
    lightsOnCount,
    lightsOffCount,
    allLightsOn,
    allLightsOff,
    isRoomOn,
    totalLightsOn,
    totalLightsOff,
    allHouseLightsOn,
    allHouseLightsOff,
    hasAnyLights,
    avgBrightness,

    // Dynamic styling state
    roomColors,
    roomOnBrightness,
    dynamicRoomStyle,
    contrastMode,
    adaptive,

    // Actions
    setSelectedRoomId,
    setLocalBrightness,
    setError,
    setPairingError,
    setRefreshing,
    setLoadingMessage,
    checkConnection,
    fetchData,
    handleRefresh,

    // Pairing state setters
    setPairing,
    setPairingStep,
    setDiscoveredBridges,
    setSelectedBridge,
    setPairingCountdown,
    pairingTimerRef,
  };
}
