'use client';
/**
 * useAutomationDeviceOptions — Phase 180.1
 *
 * Lazy per-category fetch hooks that surface device pickers for the action
 * forms. Each hook hits the existing Auth0-protected Next API route, which
 * proxies to the HA backend via the haClient module. Hooks short-circuit when
 * `enabled=false` so unused dropdowns don't trigger network traffic.
 *
 * Returned options are stable between renders for a given fetch result so the
 * native <select> doesn't churn its key list.
 */
import { useEffect, useState } from 'react';
import type { EmberSelectOption } from '../primitives/EmberSelect';
import type { HueLight, HueGroup, HueScene } from '@/types/hueProxy';
import type { NetatmoProxyHome } from '@/types/netatmoProxy';
import type { SonosDeviceResponse } from '@/types/sonosProxy';
import type { TuyaPlug } from '@/types/tuyaProxy';

export interface DeviceOptionsResult {
  options: EmberSelectOption[];
  loading: boolean;
  error: string | null;
}

interface FetchOptions<T> {
  url: string;
  enabled: boolean;
  extract: (json: unknown) => EmberSelectOption[];
  /** Re-fetch when these change (e.g. parent home_id for nested rooms). */
  deps?: ReadonlyArray<unknown>;
  /** Optional raw data sink for derived hooks (homes → rooms/schedules). */
  onRaw?: (raw: T) => void;
}

function useFetchedOptions<T>({ url, enabled, extract, deps = [], onRaw }: FetchOptions<T>): DeviceOptionsResult {
  const [options, setOptions] = useState<EmberSelectOption[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setOptions([]);
      setLoading(false);
      setError(null);
      return;
    }
    const ac = new AbortController();
    setLoading(true);
    setError(null);
    fetch(url, { signal: ac.signal })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const json: unknown = await r.json();
        if (onRaw) onRaw(json as T);
        setOptions(extract(json));
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => setLoading(false));
    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, enabled, ...deps]);

  return { options, loading, error };
}

// ─── Hue ─────────────────────────────────────────────────────────────────────

// API envelopes here are double-wrapped: route handlers call success({ lights: data })
// where data itself is the raw HA proxy payload `{ lights, count, is_stale, fetched_at }`.
// Same for groups. Hook extractors peel both layers.

export function useHueLightOptions(enabled = true): DeviceOptionsResult {
  return useFetchedOptions<{ lights: { lights: HueLight[] } }>({
    url: '/api/v1/hue/lights',
    enabled,
    extract: (j) => {
      const lights = (j as { lights?: { lights?: HueLight[] } }).lights?.lights ?? [];
      return lights.map((l) => ({
        value: l.light_id,
        label: l.custom_name ?? l.name,
      }));
    },
  });
}

export function useHueGroupOptions(enabled = true): DeviceOptionsResult {
  return useFetchedOptions<{ groups: { groups: HueGroup[] } }>({
    url: '/api/v1/hue/groups',
    enabled,
    extract: (j) => {
      const groups = (j as { groups?: { groups?: HueGroup[] } }).groups?.groups ?? [];
      return groups.map((g) => ({ value: g.group_id, label: g.name }));
    },
  });
}

export function useHueSceneOptions(groupId: string, enabled = true): DeviceOptionsResult {
  const url = groupId ? `/api/v1/hue/scenes?group_id=${encodeURIComponent(groupId)}` : '/api/v1/hue/scenes';
  return useFetchedOptions<{ scenes: HueScene[] }>({
    url,
    enabled: enabled && groupId.length > 0,
    deps: [groupId],
    extract: (j) => {
      const scenes = (j as { scenes?: HueScene[] }).scenes ?? [];
      return scenes.map((s) => ({ value: s.scene_id, label: s.name }));
    },
  });
}

// ─── Netatmo ─────────────────────────────────────────────────────────────────

interface NetatmoCache {
  homes: NetatmoProxyHome[];
}

// Netatmo route handler returns the HA proxy response unwrapped — homes live
// under `body.homes`, alongside `status`, `time_exec`, `time_server`.
function extractHomes(j: unknown): NetatmoProxyHome[] {
  const body = (j as { body?: { homes?: NetatmoProxyHome[] } }).body;
  return body?.homes ?? [];
}

export function useNetatmoHomeOptions(enabled = true): DeviceOptionsResult & { _cache: NetatmoCache } {
  const [cache, setCache] = useState<NetatmoCache>({ homes: [] });
  const result = useFetchedOptions<unknown>({
    url: '/api/v1/netatmo/homesdata',
    enabled,
    extract: (j) => extractHomes(j).map((h) => ({ value: h.id, label: h.name })),
    onRaw: (raw) => setCache({ homes: extractHomes(raw) }),
  });
  return { ...result, _cache: cache };
}

export function netatmoRoomsForHome(homes: NetatmoProxyHome[], homeId: string): EmberSelectOption[] {
  const home = homes.find((h) => h.id === homeId);
  return (home?.rooms ?? []).map((r) => ({ value: r.id, label: r.name }));
}

export function netatmoSchedulesForHome(homes: NetatmoProxyHome[], homeId: string): EmberSelectOption[] {
  const home = homes.find((h) => h.id === homeId);
  return (home?.schedules ?? []).map((s) => ({ value: s.id, label: s.name }));
}

// ─── Sonos ───────────────────────────────────────────────────────────────────

export function useSonosSpeakerOptions(enabled = true): DeviceOptionsResult {
  return useFetchedOptions<{ devices: { speakers: SonosDeviceResponse[] } }>({
    url: '/api/v1/sonos/devices',
    enabled,
    extract: (j) => {
      // Same double-wrap pattern as Hue: route returns success({ devices: data })
      // where data is the HA payload `{ speakers, count, is_stale, fetched_at }`.
      const speakers =
        (j as { devices?: { speakers?: SonosDeviceResponse[] } }).devices?.speakers ?? [];
      return speakers.map((d) => ({ value: d.uid, label: d.name }));
    },
  });
}

// ─── Tuya ────────────────────────────────────────────────────────────────────

export function useTuyaPlugOptions(enabled = true): DeviceOptionsResult {
  return useFetchedOptions<{ plugs: TuyaPlug[] }>({
    url: '/api/tuya/plugs',
    enabled,
    extract: (j) => {
      const plugs = (j as { plugs?: TuyaPlug[] }).plugs ?? [];
      return plugs.map((p) => ({
        value: p.device_id,
        label: p.custom_name ?? p.device_id,
      }));
    },
  });
}
