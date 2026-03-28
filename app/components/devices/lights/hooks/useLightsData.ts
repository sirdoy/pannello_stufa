/**
 * useLightsData Hook
 *
 * Encapsulates all Philips Hue lights state management:
 * - WebSocket primary channel: subscribes to 'hue' topic (MIG-07)
 * - HTTP polling fallback (60s, alwaysActive:false) when WS is unavailable (MIG-08)
 * - Connection checking via /api/hue/status (data_freshness-based staleness)
 * - Data fetching (groups, lights, scenes) using proxy-native flat shapes
 * - Derived state computation
 * - Dynamic styling based on room light colors
 *
 * Pairing state machine removed — proxy handles Bridge connectivity.
 *
 * This hook guarantees SINGLE polling loop for LightsCard.
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { useAdaptivePolling } from '@/lib/hooks/useAdaptivePolling';
import { supportsColor, getCurrentColorHex } from '@/lib/hue/colorUtils';
import { useWebSocketContext } from '@/app/context/WebSocketContext';
import { ReadyState } from '@/lib/hooks/useWebSocketManager';
import type { HueData, HueLight as WsHueLight, HueGroup as WsHueGroup } from '@/types/websocket';
import type { HueLight, HueGroup, HueScene } from '@/types/hueProxy';

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
  stale: boolean;
  groups: HueGroup[];
  lights: HueLight[];
  scenes: HueScene[];
  selectedGroupId: string | null;
  refreshing: boolean;
  loadingMessage: string;
  localBrightness: number | null;

  // Derived state (computed from groups/lights/scenes)
  selectedGroup: HueGroup | undefined;
  selectedGroupId_action: string | null;
  roomLights: HueLight[];
  roomScenes: HueScene[];
  effectiveLights: HueLight[];
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

  // Timestamp for LastUpdated component
  lastUpdatedAt: number | null;

  // Dynamic styling state
  roomColors: string[];
  roomOnBrightness: number;
  dynamicRoomStyle: Record<string, string> | null;
  contrastMode: 'light' | 'dark' | 'default';
  adaptive: AdaptiveClasses;

  // Actions
  setSelectedGroupId: (id: string | null) => void;
  setLocalBrightness: (val: number | null) => void;
  setError: (err: string | null) => void;
  setRefreshing: (val: boolean) => void;
  setLoadingMessage: (msg: string) => void;
  checkConnection: () => Promise<void>;
  fetchData: () => Promise<void>;
  handleRefresh: () => Promise<void>;
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
  const [stale, setStale] = useState(false);
  const [groups, setGroups] = useState<HueGroup[]>([]);
  const [lights, setLights] = useState<HueLight[]>([]);
  const [scenes, setScenes] = useState<HueScene[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Caricamento...');
  const [localBrightness, setLocalBrightness] = useState<number | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);

  // WS context — primary data channel (MIG-07)
  const { subscribe, unsubscribe, readyState } = useWebSocketContext();
  const isWsConnected = readyState === ReadyState.OPEN;

  // Check connection on mount
  useEffect(() => {
    checkConnection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function checkConnection() {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/hue/status');
      if (!response.ok) {
        // 503 = Bridge UNREACHABLE
        setConnected(false);
        setStale(false);
        return;
      }
      const health = await response.json() as { connected?: boolean; data_freshness?: string; success?: boolean };
      setConnected(health.connected ?? false);
      setStale(health.data_freshness === 'STALE');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('Errore connessione Hue:', err);
      setConnected(false);
      setStale(false);
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  // Standalone fetchScenes for fire-and-forget from WS handleMessage (D-14)
  async function fetchScenes() {
    try {
      const res = await fetch('/api/hue/scenes');
      if (!res.ok) return;
      const data = await res.json() as { scenes?: HueScene[] };
      setScenes(data.scenes ?? []);
    } catch {
      // Silent failure — scenes rarely change
    }
  }

  // Ref to avoid stale closure in WS useEffect (D-18)
  const fetchScenesRef = useRef(fetchScenes);
  fetchScenesRef.current = fetchScenes;

  // WS subscription: primary data channel (MIG-07)
  useEffect(() => {
    if (!isWsConnected) return;

    const handleMessage = (raw: unknown) => {
      const data = raw as HueData;

      // Convert Record<string, WsHueLight> → HueLight[] (D-12, D-13)
      if (data.lights) {
        const lights: HueLight[] = Object.entries(data.lights).map(([id, wsLight]: [string, WsHueLight]) => ({
          light_id: id,
          name: wsLight.name,
          on: wsLight.state.on,
          brightness: wsLight.state.bri,                                    // bri → brightness (D-13)
          ct_mirek: wsLight.state.ct,
          ct_kelvin: wsLight.state.ct ? Math.round(1_000_000 / wsLight.state.ct) : null,
          hue: null,
          saturation: null,
          colormode: wsLight.state.colormode,
          reachable: wsLight.state.reachable,
          capability_tier: 'color' as const,                                // WS has no tier — default to 'color'
          room_id: null,
          room_name: null,
          model_id: wsLight.modelid,
          light_type: wsLight.type,
        }));
        setLights(lights);
      }

      // Convert Record<string, WsHueGroup> → HueGroup[], sorted 'Casa' first (D-12)
      if (data.groups) {
        const rawGroups: HueGroup[] = Object.entries(data.groups).map(([id, wsGroup]: [string, WsHueGroup]) => ({
          group_id: id,
          name: wsGroup.name,
          type: null,
          group_class: null,
          lights: wsGroup.lights,
          any_on: wsGroup.state.any_on,
          all_on: wsGroup.state.all_on,
          brightness: null,
          color_temp: null,
          colormode: null,
        }));
        const sortedGroups = rawGroups.sort((a, b) => {
          if (a.name === 'Casa') return -1;
          if (b.name === 'Casa') return 1;
          return a.name.localeCompare(b.name);
        });
        setGroups(sortedGroups);
      }

      // WS connection = live data (D-15)
      setConnected(true);
      setStale(false);
      setLoading(false);
      setError(null);
      setLastUpdatedAt(Date.now());

      // Scenes not in WS payload — fire-and-forget HTTP fetch (D-14)
      void fetchScenesRef.current();
    };

    subscribe('hue', handleMessage);
    return () => { unsubscribe('hue', handleMessage); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWsConnected, subscribe, unsubscribe]);

  async function fetchData() {
    try {
      setError(null);
      const [groupsRes, lightsRes, scenesRes] = await Promise.all([
        fetch('/api/hue/rooms'),
        fetch('/api/hue/lights'),
        fetch('/api/hue/scenes'),
      ]);
      const [groupsData, lightsData, scenesData] = await Promise.all([
        groupsRes.json() as Promise<{ groups?: HueGroup[]; reconnect?: boolean; error?: string; success?: boolean }>,
        lightsRes.json() as Promise<{ lights?: HueLight[]; reconnect?: boolean; error?: string; success?: boolean }>,
        scenesRes.json() as Promise<{ scenes?: HueScene[]; reconnect?: boolean; error?: string; success?: boolean }>,
      ]);
      if (groupsData.reconnect || lightsData.reconnect || scenesData.reconnect) {
        setConnected(false);
        return;
      }
      if (groupsData.error) throw new Error(groupsData.error);
      if (lightsData.error) throw new Error(lightsData.error);
      if (scenesData.error) throw new Error(scenesData.error);
      // Sort groups: 'Casa' first, then alphabetical
      const sortedGroups = (groupsData.groups ?? []).sort((a, b) => {
        if (a.name === 'Casa') return -1;
        if (b.name === 'Casa') return 1;
        return a.name.localeCompare(b.name);
      });
      setGroups(sortedGroups);
      setLights(lightsData.lights ?? []);
      setScenes(scenesData.scenes ?? []);
      setLastUpdatedAt(Date.now());
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

  // Poll data every 60 seconds - pauses when tab hidden
  // WS gate first: suppress polling when WS is OPEN (MIG-08)
  // initialDelay: 100ms stagger to avoid thundering herd on dashboard mount
  useAdaptivePolling({
    callback: fetchData,
    interval: isWsConnected ? null : (connected ? 60000 : null),  // WS gate first, then connected gate
    alwaysActive: false, // Non-critical: pause when hidden
    immediate: true,
    initialDelay: 100,
  });

  // Auto-select first group
  useEffect(() => {
    if (groups.length > 0 && !selectedGroupId) {
      setSelectedGroupId(groups[0]?.group_id ?? null);
    }
  }, [groups, selectedGroupId]);

  // Derived state computations
  const selectedGroup = groups.find(g => g.group_id === selectedGroupId) ?? groups[0];

  // selectedGroupId_action = group_id for the action endpoint
  const selectedGroupId_action = selectedGroup?.group_id ?? null;

  // Room lights: direct membership check via HueGroup.lights (array of light_id strings)
  const roomLights = lights.filter(light =>
    selectedGroup?.lights.includes(light.light_id) ?? false
  );

  // Room scenes
  const roomScenes = scenes.filter(scene =>
    scene.group_id === selectedGroup?.group_id
  );

  // Check if room has any color-capable lights
  const hasColorLights = roomLights.some(light => supportsColor(light));

  // effectiveLights = roomLights (no more serviceLights fallback — proxy is single-path)
  const effectiveLights = roomLights;

  // Calculate lights on/off state — use light.on (boolean directly, not light.on?.on)
  const lightsOnCount = effectiveLights.filter(light => light.on).length;
  const lightsOffCount = effectiveLights.length - lightsOnCount;
  const allLightsOn = effectiveLights.length > 0 && lightsOnCount === effectiveLights.length;
  const allLightsOff = effectiveLights.length > 0 && lightsOffCount === effectiveLights.length;

  // isRoomOn: check if any light in room is on
  const isRoomOn = effectiveLights.some(light => light.on);

  // Total house stats — use light.on (not light.on?.on)
  const totalLightsOn = lights.filter(l => l.on).length;
  const totalLightsOff = lights.length - totalLightsOn;
  const allHouseLightsOn = lights.length > 0 && totalLightsOn === lights.length;
  const allHouseLightsOff = lights.length > 0 && totalLightsOff === lights.length;
  const hasAnyLights = lights.length > 0;

  // avgBrightness: compute from individual lights (not group.brightness which is stale)
  // Convert from 0-254 to 0-100 percent
  const avgBrightness = effectiveLights.length === 0
    ? 0
    : Math.round(
        effectiveLights.reduce((sum, l) => sum + Math.round((l.brightness ?? 0) / 254 * 100), 0) / effectiveLights.length
      );

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
    const onLights = effectiveLights.filter(light => light.on);
    if (onLights.length === 0) return { colors: [], avgBrightness: 0 };

    const colors = onLights
      .map(light => {
        const hex = getCurrentColorHex(light);
        return hex || '#FFE4B5'; // warm white fallback for non-color lights
      })
      .filter(Boolean) as string[];

    const uniqueColors = Array.from(new Set(colors));

    // Average brightness of ON lights (convert 0-254 to 0-100)
    const onBrightness = Math.round(
      onLights.reduce((sum, l) => sum + Math.round((l.brightness ?? 0) / 254 * 100), 0) / onLights.length
    );

    return { colors: uniqueColors, avgBrightness: onBrightness };
  };

  const { colors: roomColors, avgBrightness: roomOnBrightness } = getRoomLightColors();

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

  const dynamicRoomStyle = getRoomControlStyle();

  // Determine contrast mode for adaptive UI
  const contrastMode = dynamicRoomStyle ? getContrastMode(roomColors, roomOnBrightness) : 'default';

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
    stale,
    groups,
    lights,
    scenes,
    selectedGroupId,
    refreshing,
    loadingMessage,
    localBrightness,

    // Derived state
    selectedGroup,
    selectedGroupId_action,
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

    // Timestamp
    lastUpdatedAt,

    // Dynamic styling state
    roomColors,
    roomOnBrightness,
    dynamicRoomStyle,
    contrastMode,
    adaptive,

    // Actions
    setSelectedGroupId,
    setLocalBrightness,
    setError,
    setRefreshing,
    setLoadingMessage,
    checkConnection,
    fetchData,
    handleRefresh,
  };
}
