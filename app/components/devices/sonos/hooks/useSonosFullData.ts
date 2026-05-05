'use client';

import { useState, useRef, useEffect } from 'react';
import { useAdaptivePolling } from '@/lib/hooks/useAdaptivePolling';
import { useVisibility } from '@/lib/hooks/useVisibility';
import { useWebSocketContext } from '@/app/context/WebSocketContext';
import { ReadyState } from '@/lib/hooks/useWebSocketManager';
import type {
  SonosDeviceResponse,
  SonosZoneResponse,
  SonosPlaybackResponse,
  SonosVolumeResponse,
  SonosPlayModeResponse,
  SonosSleepTimerResponse,
  SonosEqResponse,
  SonosHomeTheaterResponse,
} from '@/types/sonosProxy';

export interface SonosFullData {
  devices: SonosDeviceResponse[];
  zones: SonosZoneResponse[];
  playback: Record<string, SonosPlaybackResponse>;  // keyed by group_id
  volumes: Record<string, SonosVolumeResponse>;      // keyed by uid
  playModes: Record<string, SonosPlayModeResponse>;  // keyed by group_id
  sleepTimers: Record<string, SonosSleepTimerResponse>; // keyed by group_id
  eqData: Record<string, SonosEqResponse>;           // keyed by uid
  homeTheaterData: Record<string, SonosHomeTheaterResponse>; // keyed by uid
}

export interface UseSonosFullDataReturn {
  data: SonosFullData | null;
  loading: boolean;
  error: string | null;
  stale: boolean;
  fetchData: () => Promise<void>;
}

// WS sonos_transport payload (push-only, per docs/api/websocket.md)
interface SonosTransportWsPayload {
  group_id: string;
  transport_state: string | null;
  title: string | null;
  artist: string | null;
  album: string | null;
  album_art_url: string | null;
  position: number | null;       // seconds (REST shape uses HH:MM:SS string)
  duration: number | null;       // seconds
  source_type: string | null;
}

// WS sonos_volume payload (push-only, two shapes)
interface SonosVolumeWsSinglePayload {
  uid: string;
  volume: number;
  mute: boolean;
}
interface SonosVolumeWsZonePayload {
  group_id: string;
  volumes: Array<{ uid: string; volume: number; mute: boolean }>;
}

// WS sonos snapshot/event payload (subset we use)
interface SonosWsPayload {
  speakers?: SonosDeviceResponse[] | null;
  groups?: SonosZoneResponse[] | null;
}

function secondsToHms(s: number | null): string | null {
  if (s == null || !Number.isFinite(s) || s < 0) return null;
  const total = Math.floor(s);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const sec = total % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function isTransportState(v: string | null): SonosPlaybackResponse['transport_state'] {
  if (v === 'PLAYING' || v === 'PAUSED_PLAYBACK' || v === 'STOPPED' || v === 'TRANSITIONING') {
    return v;
  }
  return null;
}

function isSourceType(v: string | null): SonosPlaybackResponse['source_type'] {
  if (v === 'tv' || v === 'streaming' || v === 'radio' || v === 'line_in' || v === 'airplay' || v === 'unknown') {
    return v;
  }
  return null;
}

function adaptTransport(raw: SonosTransportWsPayload): SonosPlaybackResponse {
  return {
    group_id: raw.group_id,
    transport_state: isTransportState(raw.transport_state),
    title: raw.title,
    artist: raw.artist,
    album: raw.album,
    album_art_url: raw.album_art_url,
    position: secondsToHms(raw.position),
    duration: secondsToHms(raw.duration),
    source_type: isSourceType(raw.source_type),
  };
}

export function useSonosFullData(): UseSonosFullDataReturn {
  const [data, setData] = useState<SonosFullData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stale, setStale] = useState(false);
  const dataRef = useRef<SonosFullData | null>(null);
  const initialFetchDoneRef = useRef(false);

  const isVisible = useVisibility();
  const interval = isVisible ? 60000 : 300000;

  const { subscribe, unsubscribe, readyState } = useWebSocketContext();
  const isWsConnected = readyState === ReadyState.OPEN;

  const fetchData = async () => {
    try {
      setError(null);

      // 0. Fetch devices list
      const devicesRes = await fetch('/api/v1/sonos/devices');
      if (!devicesRes.ok) throw new Error('Devices endpoint failed');
      const devicesBody = (await devicesRes.json()) as { devices: SonosDeviceResponse[] };
      const devices = devicesBody.devices;

      // 1. Fetch zones (wrapped in { zones: [...] })
      const zonesRes = await fetch('/api/v1/sonos/zones');
      if (!zonesRes.ok) throw new Error('Zones endpoint failed');
      const zonesBody = (await zonesRes.json()) as { zones: SonosZoneResponse[] };
      const zones = zonesBody.zones;

      // 2. Fetch playback for ALL zones in parallel using Promise.allSettled
      const playbackResults = await Promise.allSettled(
        zones.map(z =>
          fetch(`/api/v1/sonos/zones/${z.group_id}/playback`).then(r => {
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
          fetch(`/api/v1/sonos/speakers/${uid}/volume`).then(r => {
            if (!r.ok) throw new Error('volume failed');
            return r.json() as Promise<SonosVolumeResponse>;
          })
        )
      );
      const volumes: Record<string, SonosVolumeResponse> = {};
      volumeResults.forEach((r, i) => {
        if (r.status === 'fulfilled') volumes[allUids[i]!] = r.value;
      });

      // 4b. Fetch EQ and home-theater for ALL speakers in parallel
      const [eqResults, htResults] = await Promise.all([
        Promise.allSettled(
          allUids.map(uid =>
            fetch(`/api/v1/sonos/speakers/${uid}/eq`).then(r => {
              if (!r.ok) throw new Error('eq failed');
              return r.json() as Promise<SonosEqResponse>;
            })
          )
        ),
        Promise.allSettled(
          allUids.map(uid =>
            fetch(`/api/v1/sonos/speakers/${uid}/home-theater`).then(r => {
              if (!r.ok) throw new Error('home-theater failed');
              return r.json() as Promise<SonosHomeTheaterResponse>;
            })
          )
        ),
      ]);
      const eqData: Record<string, SonosEqResponse> = {};
      eqResults.forEach((r, i) => {
        if (r.status === 'fulfilled') eqData[allUids[i]!] = r.value;
      });
      const homeTheaterData: Record<string, SonosHomeTheaterResponse> = {};
      htResults.forEach((r, i) => {
        if (r.status === 'fulfilled') homeTheaterData[allUids[i]!] = r.value;
      });

      // 5. Fetch play-mode and sleep-timer for ALL zones in parallel
      const [playModeResults, sleepTimerResults] = await Promise.all([
        Promise.allSettled(
          zones.map(z =>
            fetch(`/api/v1/sonos/zones/${z.group_id}/play-mode`).then(r => {
              if (!r.ok) throw new Error('play-mode failed');
              return r.json() as Promise<SonosPlayModeResponse>;
            })
          )
        ),
        Promise.allSettled(
          zones.map(z =>
            fetch(`/api/v1/sonos/zones/${z.group_id}/sleep-timer`).then(r => {
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

      const newData: SonosFullData = { devices, zones, playback, volumes, playModes, sleepTimers, eqData, homeTheaterData };
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

  // One-shot initial REST fetch — runs on mount regardless of WS state so the
  // hook always exposes a populated snapshot before the first WS event arrives
  // (sonos_transport / sonos_volume are push-only — no snapshot on subscribe).
  const fetchDataRef = useRef(fetchData);
  fetchDataRef.current = fetchData;
  useEffect(() => {
    if (initialFetchDoneRef.current) return;
    initialFetchDoneRef.current = true;
    void fetchDataRef.current();
  }, []);

  // WS subscriptions — primary live channel. Subscribes to:
  //  - 'sonos'           → speakers + groups (snapshot on subscribe)
  //  - 'sonos_transport' → playback per group_id (push-only)
  //  - 'sonos_volume'    → volume per speaker or zone (push-only)
  // EQ / home-theater / play-mode / sleep-timer are not on WS — they keep the
  // values from the initial REST fetch (they rarely change; explicit fetchData
  // exposed in the return value triggers a fresh load on demand).
  useEffect(() => {
    if (!isWsConnected) return;

    const handleSonos = (raw: unknown) => {
      const ws = raw as SonosWsPayload;
      const devices = ws.speakers ?? [];
      const zones = ws.groups ?? [];
      setData(prev => {
        const base: SonosFullData = prev ?? {
          devices: [], zones: [],
          playback: {}, volumes: {},
          playModes: {}, sleepTimers: {},
          eqData: {}, homeTheaterData: {},
        };
        const next: SonosFullData = { ...base, devices, zones };
        dataRef.current = next;
        return next;
      });
      setStale(false);
      setLoading(false);
      setError(null);
    };

    const handleTransport = (raw: unknown) => {
      const ws = raw as SonosTransportWsPayload;
      if (!ws || typeof ws.group_id !== 'string') return;
      const adapted = adaptTransport(ws);
      setData(prev => {
        if (!prev) return prev;
        const next: SonosFullData = {
          ...prev,
          playback: { ...prev.playback, [ws.group_id]: adapted },
        };
        dataRef.current = next;
        return next;
      });
    };

    const handleVolume = (raw: unknown) => {
      const ws = raw as SonosVolumeWsSinglePayload | SonosVolumeWsZonePayload;
      if (!ws) return;
      setData(prev => {
        if (!prev) return prev;
        const volumes = { ...prev.volumes };
        if ('uid' in ws && typeof ws.uid === 'string') {
          volumes[ws.uid] = { uid: ws.uid, volume: ws.volume, mute: ws.mute };
        } else if ('volumes' in ws && Array.isArray(ws.volumes)) {
          for (const v of ws.volumes) {
            volumes[v.uid] = { uid: v.uid, volume: v.volume, mute: v.mute };
          }
        } else {
          return prev;
        }
        const next: SonosFullData = { ...prev, volumes };
        dataRef.current = next;
        return next;
      });
    };

    subscribe('sonos', handleSonos);
    subscribe('sonos_transport', handleTransport);
    subscribe('sonos_volume', handleVolume);
    return () => {
      unsubscribe('sonos', handleSonos);
      unsubscribe('sonos_transport', handleTransport);
      unsubscribe('sonos_volume', handleVolume);
    };
  }, [isWsConnected, subscribe, unsubscribe]);

  // Polling fallback: only runs when WS is CLOSED. The explicit one-shot
  // initial fetch above handles the first paint; polling resumes if the WS
  // connection drops.
  useAdaptivePolling({
    callback: fetchData,
    interval: isWsConnected ? null : interval,
    alwaysActive: false,
    immediate: false,
    initialDelay: 200,
  });

  return { data, loading, error, stale, fetchData };
}
