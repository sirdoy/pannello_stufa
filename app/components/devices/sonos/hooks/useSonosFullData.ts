'use client';

import { useState, useRef } from 'react';
import { useAdaptivePolling } from '@/lib/hooks/useAdaptivePolling';
import { useVisibility } from '@/lib/hooks/useVisibility';
import type { SonosZoneResponse, SonosPlaybackResponse, SonosVolumeResponse, SonosPlayModeResponse, SonosSleepTimerResponse } from '@/types/sonosProxy';

export interface SonosFullData {
  zones: SonosZoneResponse[];
  playback: Record<string, SonosPlaybackResponse>;  // keyed by group_id
  volumes: Record<string, SonosVolumeResponse>;      // keyed by uid
  playModes: Record<string, SonosPlayModeResponse>;  // keyed by group_id
  sleepTimers: Record<string, SonosSleepTimerResponse>; // keyed by group_id
}

export interface UseSonosFullDataReturn {
  data: SonosFullData | null;
  loading: boolean;
  error: string | null;
  stale: boolean;
  fetchData: () => Promise<void>;
}

export function useSonosFullData(): UseSonosFullDataReturn {
  const [data, setData] = useState<SonosFullData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stale, setStale] = useState(false);
  const dataRef = useRef<SonosFullData | null>(null);

  const isVisible = useVisibility();
  const interval = isVisible ? 60000 : 300000;

  const fetchData = async () => {
    try {
      setError(null);

      // 1. Fetch zones (wrapped in { zones: [...] })
      const zonesRes = await fetch('/api/sonos/zones');
      if (!zonesRes.ok) throw new Error('Zones endpoint failed');
      const zonesBody = (await zonesRes.json()) as { zones: SonosZoneResponse[] };
      const zones = zonesBody.zones;

      // 2. Fetch playback for ALL zones in parallel using Promise.allSettled
      const playbackResults = await Promise.allSettled(
        zones.map(z =>
          fetch(`/api/sonos/zones/${z.group_id}/playback`).then(r => {
            if (!r.ok) throw new Error('playback failed');
            return r.json() as Promise<SonosPlaybackResponse>;
          })
        )
      );
      const playback: Record<string, SonosPlaybackResponse> = {};
      playbackResults.forEach((r, i) => {
        if (r.status === 'fulfilled') playback[zones[i]!.group_id] = r.value;
      });

      // 3. Collect unique speaker UIDs
      const allUids = [...new Set(zones.flatMap(z => z.members.map(m => m.uid)))];

      // 4. Fetch volumes for ALL speakers using Promise.allSettled
      const volumeResults = await Promise.allSettled(
        allUids.map(uid =>
          fetch(`/api/sonos/speakers/${uid}/volume`).then(r => {
            if (!r.ok) throw new Error('volume failed');
            return r.json() as Promise<SonosVolumeResponse>;
          })
        )
      );
      const volumes: Record<string, SonosVolumeResponse> = {};
      volumeResults.forEach((r, i) => {
        if (r.status === 'fulfilled') volumes[allUids[i]!] = r.value;
      });

      // 5. Fetch play-mode and sleep-timer for ALL zones in parallel
      const [playModeResults, sleepTimerResults] = await Promise.all([
        Promise.allSettled(
          zones.map(z =>
            fetch(`/api/sonos/zones/${z.group_id}/play-mode`).then(r => {
              if (!r.ok) throw new Error('play-mode failed');
              return r.json() as Promise<SonosPlayModeResponse>;
            })
          )
        ),
        Promise.allSettled(
          zones.map(z =>
            fetch(`/api/sonos/zones/${z.group_id}/sleep-timer`).then(r => {
              if (!r.ok) throw new Error('sleep-timer failed');
              return r.json() as Promise<SonosSleepTimerResponse>;
            })
          )
        ),
      ]);
      const playModes: Record<string, SonosPlayModeResponse> = {};
      playModeResults.forEach((r, i) => {
        if (r.status === 'fulfilled') playModes[zones[i]!.group_id] = r.value;
      });
      const sleepTimers: Record<string, SonosSleepTimerResponse> = {};
      sleepTimerResults.forEach((r, i) => {
        if (r.status === 'fulfilled') sleepTimers[zones[i]!.group_id] = r.value;
      });

      const newData: SonosFullData = { zones, playback, volumes, playModes, sleepTimers };
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
    initialDelay: 200,
  });

  return { data, loading, error, stale, fetchData };
}
