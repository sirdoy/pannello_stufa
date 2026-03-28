'use client';

import { useState, useEffect, useRef } from 'react';
import { useAdaptivePolling } from '@/lib/hooks/useAdaptivePolling';
import { useVisibility } from '@/lib/hooks/useVisibility';
import { useWebSocketContext } from '@/app/context/WebSocketContext';
import { ReadyState } from '@/lib/hooks/useWebSocketManager';
import type { SonosData as WsSonosData } from '@/types/websocket';
import type {
  SonosHealthResponse,
  SonosZoneResponse,
  SonosPlaybackResponse,
} from '@/types/sonosProxy';

export interface SonosData {
  health: SonosHealthResponse;
  zones: SonosZoneResponse[];
  nowPlaying: SonosPlaybackResponse | null;
  speakerCount: number;
  zoneCount: number;
}

export interface UseSonosDataReturn {
  data: SonosData | null;
  loading: boolean;
  error: string | null;
  stale: boolean;
  lastUpdatedAt: number | null;
}

export function useSonosData(): UseSonosDataReturn {
  const [data, setData] = useState<SonosData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stale, setStale] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const dataRef = useRef<SonosData | null>(null);

  const isVisible = useVisibility();
  const interval = isVisible ? 60000 : 300000;

  // WS context — primary data channel (MIG-09)
  const { subscribe, unsubscribe, readyState } = useWebSocketContext();
  const isWsConnected = readyState === ReadyState.OPEN;

  const fetchData = async () => {
    try {
      setError(null);

      // Fetch health
      const healthRes = await fetch('/api/sonos/health');
      if (!healthRes.ok) throw new Error('Health endpoint failed');
      const health = (await healthRes.json()) as SonosHealthResponse;

      // Fetch zones (wrapped in { zones: [...] })
      const zonesRes = await fetch('/api/sonos/zones');
      if (!zonesRes.ok) throw new Error('Zones endpoint failed');
      const zonesBody = (await zonesRes.json()) as { zones: SonosZoneResponse[] };
      const zones = zonesBody.zones;

      // Fetch playback for up to 5 zones in parallel
      const playbackResults = await Promise.allSettled(
        zones.slice(0, 5).map((z) =>
          fetch(`/api/sonos/zones/${z.group_id}/playback`).then((r) => {
            if (!r.ok) throw new Error('playback failed');
            return r.json() as Promise<SonosPlaybackResponse>;
          })
        )
      );

      const playbacks = playbackResults
        .filter(
          (r): r is PromiseFulfilledResult<SonosPlaybackResponse> =>
            r.status === 'fulfilled'
        )
        .map((r) => r.value);

      // Pick "most interesting" zone: first PLAYING, else first available
      const nowPlaying =
        playbacks.find((p) => p.transport_state === 'PLAYING') ??
        playbacks[0] ??
        null;

      const newData: SonosData = {
        health,
        zones,
        nowPlaying,
        speakerCount: health.device_count,
        zoneCount: zones.length,
      };

      dataRef.current = newData;
      setData(newData);
      setStale(false);
      setLastUpdatedAt(Date.now());
    } catch {
      setStale(true);
      if (!dataRef.current) {
        setError('Sonos non raggiungibile');
      }
    } finally {
      setLoading(false);
    }
  };

  // Standalone health fetch for fire-and-forget from WS handler (D-06)
  async function fetchHealth() {
    try {
      const healthRes = await fetch('/api/sonos/health');
      if (!healthRes.ok) return;
      const health = (await healthRes.json()) as SonosHealthResponse;
      setData(prev => prev ? { ...prev, health } : null);
    } catch {
      // Silent — health is supplementary when WS is active
    }
  }

  // Standalone playback fetch for fire-and-forget from WS handler (D-05)
  async function fetchPlayback(zones: SonosZoneResponse[]) {
    try {
      const playbackResults = await Promise.allSettled(
        zones.slice(0, 5).map((z) =>
          fetch(`/api/sonos/zones/${z.group_id}/playback`).then((r) => {
            if (!r.ok) throw new Error('playback failed');
            return r.json() as Promise<SonosPlaybackResponse>;
          })
        )
      );
      const playbacks = playbackResults
        .filter((r): r is PromiseFulfilledResult<SonosPlaybackResponse> => r.status === 'fulfilled')
        .map((r) => r.value);
      const nowPlaying = playbacks.find((p) => p.transport_state === 'PLAYING') ?? playbacks[0] ?? null;
      setData(prev => prev ? { ...prev, nowPlaying } : null);
    } catch {
      // Silent — playback is supplementary
    }
  }

  // Refs to avoid stale closures in WS useEffect (D-12, D-16)
  const fetchHealthRef = useRef(fetchHealth);
  fetchHealthRef.current = fetchHealth;
  const fetchPlaybackRef = useRef(fetchPlayback);
  fetchPlaybackRef.current = fetchPlayback;

  // WS subscription: primary data channel (MIG-09)
  useEffect(() => {
    if (!isWsConnected) return;  // Phase 141 pattern: guard against CLOSED state

    const handleMessage = (raw: unknown) => {
      const wsData = raw as WsSonosData;

      // D-03: groups map directly to zones (identical shape, cast safe)
      const zones = (wsData.groups ?? []) as unknown as SonosZoneResponse[];
      // D-04: derive counts from WS payload, not from health
      const speakerCount = wsData.speakers?.length ?? 0;
      const zoneCount = zones.length;

      // Update data, preserving health and nowPlaying from side-fetches
      setData(prev => {
        const health = prev?.health ?? { connected: true, data_freshness: 'LIVE' as const, device_count: speakerCount, last_poll_at: null, last_success_at: null };
        const nowPlaying = prev?.nowPlaying ?? null;
        return { health, zones, nowPlaying, speakerCount, zoneCount };
      });
      setStale(false);   // D-13: WS messages are always fresh
      setLoading(false);
      setError(null);
      setLastUpdatedAt(Date.now());

      // D-05: playback not in WS — fire-and-forget side-fetch with fresh zones
      void fetchPlaybackRef.current(zones);
      // D-06: health not in WS — fire-and-forget side-fetch
      void fetchHealthRef.current();
    };

    subscribe('sonos', handleMessage);
    return () => { unsubscribe('sonos', handleMessage); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWsConnected, subscribe, unsubscribe]);

  useAdaptivePolling({
    callback: fetchData,
    interval: isWsConnected ? null : interval,  // D-01: suppress polling when WS is live
    alwaysActive: false,  // D-02: non-safety-critical
    immediate: true,
    initialDelay: 600,
  });

  return { data, loading, error, stale, lastUpdatedAt };
}
