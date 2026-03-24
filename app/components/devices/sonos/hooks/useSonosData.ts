'use client';

import { useState, useRef } from 'react';
import { useAdaptivePolling } from '@/lib/hooks/useAdaptivePolling';
import { useVisibility } from '@/lib/hooks/useVisibility';
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
}

export function useSonosData(): UseSonosDataReturn {
  const [data, setData] = useState<SonosData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stale, setStale] = useState(false);
  const dataRef = useRef<SonosData | null>(null);

  const isVisible = useVisibility();
  const interval = isVisible ? 60000 : 300000;

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
    } catch {
      setStale(true);
      if (!dataRef.current) {
        setError('Sonos non raggiungibile');
      }
    } finally {
      setLoading(false);
    }
  };

  useAdaptivePolling({
    callback: fetchData,
    interval,
    alwaysActive: false,
    immediate: true,
    initialDelay: 600,
  });

  return { data, loading, error, stale };
}
