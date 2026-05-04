/**
 * API Route: Cross-Provider Device Aggregator
 *
 * GET /api/v1/devices
 *
 * Fans out to all 8 providers via `Promise.allSettled`, normalizes per-provider
 * items into a unified `Device` shape (`types/devices.ts`), sorts by
 * `provider_type` ASC then `name` ASC ('it' locale), and applies post-merge
 * pagination (D-16). Partial provider failures return HTTP 200 with the failed
 * provider in `errors[]` (D-13). Single-item providers (raspi, thermorossi)
 * always emit one item (status=0 on rejection) and do NOT contribute to
 * `errors[]` (Pitfall 4).
 *
 * Query params:
 *   - provider_type (optional): single ProviderType value; skips fan-out to
 *     other providers (D-20 perf win). Invalid value → 200 with empty result.
 *   - limit (default 100, clamp 1..1000) (D-18)
 *   - offset (default 0, clamp >=0) (D-19)
 *
 * Protected: Requires Auth0 authentication via `withAuthAndErrorHandler`.
 */

import { withAuthAndErrorHandler, success, parseQuery } from '@/lib/core';
import { fritzboxClient } from '@/lib/fritzbox';
import { getLights } from '@/lib/hue/hueProxy';
import { getDevices as getSonosDevices } from '@/lib/sonos/sonosProxy';
import { getProxyHomesdata, getProxyCameraStatus } from '@/lib/netatmo/netatmoProxy';
import { getSensors } from '@/lib/dirigera/dirigeraProxy';
import { getPlugs } from '@/lib/tuya/tuyaProxy';
import { raspiClient } from '@/lib/raspi';
import { getHealth as getThermorossiHealth } from '@/lib/stove/thermorossiProxy';
import type { Device, ProviderType, DeviceAggregatorError } from '@/types/devices';

export const dynamic = 'force-dynamic';

// =============================================================================
// CONSTANTS
// =============================================================================

const PROVIDER_TYPES: ProviderType[] = [
  'fritzbox', 'hue', 'sonos', 'netatmo', 'dirigera', 'tuya', 'raspi', 'thermorossi',
];

const SINGLE_ITEM_PROVIDERS: ReadonlySet<ProviderType> = new Set(['raspi', 'thermorossi']);

// =============================================================================
// PER-PROVIDER MAPPERS
// =============================================================================

function mapFritzbox(devices: Awaited<ReturnType<typeof fritzboxClient.getDevices>>): Device[] {
  return devices.map((d): Device => {
    const item: Device = {
      id: `fritzbox:${d.mac || d.ip}`,
      name: d.name,
      provider_type: 'fritzbox',
      type: 'network_device',
      status: d.active ? 1 : 0,
    };
    if (d.ip) item.ip = d.ip;
    if (d.mac) item.mac = d.mac;
    return item;
  });
}

function mapHue(lights: Awaited<ReturnType<typeof getLights>>): Device[] {
  return lights.map((l): Device => {
    const item: Device = {
      id: `hue:${l.light_id}`,
      name: l.custom_name ?? l.name,
      provider_type: 'hue',
      type: 'light',
      status: l.reachable ? 1 : 0,
    };
    if (l.room_name) item.room = l.room_name;
    return item;
  });
}

function mapSonos(payload: Awaited<ReturnType<typeof getSonosDevices>>): Device[] {
  // Pitfall 2: SonosDeviceResponse has no `room` field — omit room for Sonos.
  // Phase 180.x: getDevices() now returns the wrapper `{ speakers, count, … }`
  // (was a type-lying bare array); peel `.speakers` here so each call site
  // converging on this mapper does not have to repeat the unwrap.
  return payload.speakers.map((d): Device => {
    const item: Device = {
      id: `sonos:${d.uid}`,
      name: d.custom_name ?? d.name,
      provider_type: 'sonos',
      type: 'speaker',
      status: d.is_visible ? 1 : 0,
    };
    if (d.ip) item.ip = d.ip;
    return item;
  });
}

function mapNetatmo(
  homesdata: Awaited<ReturnType<typeof getProxyHomesdata>>,
  cameras: Awaited<ReturnType<typeof getProxyCameraStatus>>,
): Device[] {
  // Pitfall 1: modules live in homesdata.body.homes[0].modules (NOT homestatus).
  // Pitfall 6: cameras live in getProxyCameraStatus().
  const home = homesdata.body.homes[0];
  const items: Device[] = [];

  if (home) {
    const roomNames = new Map(home.rooms.map(r => [r.id, r.name]));
    for (const m of home.modules) {
      // Filter for thermostats and valves; skip relays/weather/etc.
      let deviceType: string | undefined;
      if (m.type === 'NATherm1') deviceType = 'thermostat';
      else if (m.type === 'NRV') deviceType = 'valve';
      else continue; // skip other module types (relay/weather/etc.)

      const item: Device = {
        id: `netatmo:${m.id}`,
        name: m.name,
        provider_type: 'netatmo',
        type: deviceType,
      };
      const roomName = m.room_id ? roomNames.get(m.room_id) : undefined;
      if (roomName) item.room = roomName;
      // status omitted for modules — homesdata does not expose reachable.
      items.push(item);
    }
  }

  for (const c of cameras.cameras) {
    items.push({
      id: `netatmo:${c.camera_id}`,
      name: c.name ?? c.camera_id,
      provider_type: 'netatmo',
      type: 'camera',
      status: c.status === 'on' ? 1 : 0,
    });
  }

  return items;
}

function mapDirigera(payload: Awaited<ReturnType<typeof getSensors>>): Device[] {
  return payload.sensors.map((s): Device => {
    let deviceType: string;
    if (s.type === 'openCloseSensor') deviceType = 'contact_sensor';
    else if (s.type === 'occupancySensor') deviceType = 'motion_sensor';
    else deviceType = 'sensor';

    const item: Device = {
      id: `dirigera:${s.id}`,
      name: s.custom_name,
      provider_type: 'dirigera',
      type: deviceType,
      status: s.is_reachable ? 1 : 0,
    };
    if (s.room) item.room = s.room;
    return item;
  });
}

function mapTuya(plugs: Awaited<ReturnType<typeof getPlugs>>): Device[] {
  // Pitfall 3: TuyaPlug has no `name` — use custom_name ?? device_id.
  return plugs.map((p): Device => ({
    id: `tuya:${p.device_id}`,
    name: p.custom_name ?? p.device_id,
    provider_type: 'tuya',
    type: 'plug',
    status: p.data_freshness === 'UNREACHABLE' ? 0 : 1,
  }));
}

function mapRaspi(result: PromiseSettledResult<unknown>): Device[] {
  // Pitfall 4: single-item provider — always emit one item; rejection => status=0 (NOT in errors[]).
  return [{
    id: 'raspi:host',
    name: 'Raspberry Pi',
    provider_type: 'raspi',
    type: 'host',
    status: result.status === 'fulfilled' ? 1 : 0,
  }];
}

function mapThermorossi(
  result: PromiseSettledResult<Awaited<ReturnType<typeof getThermorossiHealth>>>,
): Device[] {
  // Pitfall 4: single-item provider — always emit one item; rejection => status=0 (NOT in errors[]).
  return [{
    id: 'thermorossi:stove',
    name: 'Stufa',
    provider_type: 'thermorossi',
    type: 'stove',
    status: result.status === 'fulfilled' && result.value.status === 'ok' ? 1 : 0,
  }];
}

// =============================================================================
// GET HANDLER
// =============================================================================

/**
 * GET /api/v1/devices
 *
 * Cross-provider device aggregator. Fans out to all 8 providers via
 * `Promise.allSettled`, normalizes per-provider items into a unified Device
 * shape, sorts (provider_type ASC, then name ASC Italian-locale), and applies
 * post-merge pagination.
 *
 * Partial provider failures return HTTP 200 with the failed provider in
 * `errors[]`. Single-item providers (raspi, thermorossi) emit an item with
 * status=0 on rejection and do NOT contribute to `errors[]`.
 */
export const GET = withAuthAndErrorHandler(async (request) => {
  const sp = parseQuery(request);

  // --- Limit clamp (D-18): 1..1000 default 100, NaN-safe ---
  const rawLimit = sp.has('limit') ? Number(sp.get('limit')) : 100;
  const limit = Number.isFinite(rawLimit) ? Math.max(1, Math.min(rawLimit, 1000)) : 100;

  // --- Offset clamp (D-19): >=0 default 0, NaN-safe ---
  const rawOffset = sp.has('offset') ? Number(sp.get('offset')) : 0;
  const offset = Number.isFinite(rawOffset) ? Math.max(0, rawOffset) : 0;

  // --- Provider filter (D-20): single-value, invalid => empty result ---
  const providerFilterRaw = sp.get('provider_type');
  const providerFilter: ProviderType | null =
    providerFilterRaw !== null && PROVIDER_TYPES.includes(providerFilterRaw as ProviderType)
      ? (providerFilterRaw as ProviderType)
      : null;

  if (providerFilterRaw !== null && providerFilter === null) {
    // Invalid provider_type value — short-circuit per D-20.
    return success({
      items: [],
      total_count: 0,
      limit,
      offset,
      errors: [],
    });
  }

  // --- Build promiseSpec, filtered by providerFilter (Pitfall 5 perf win) ---
  type Slot = { type: ProviderType; fn: () => Promise<unknown> };
  const allSlots: Slot[] = [
    { type: 'fritzbox', fn: () => fritzboxClient.getDevices() },
    { type: 'hue', fn: () => getLights() },
    { type: 'sonos', fn: () => getSonosDevices() },
    { type: 'netatmo', fn: () => Promise.all([getProxyHomesdata(), getProxyCameraStatus()]) },
    { type: 'dirigera', fn: () => getSensors() },
    { type: 'tuya', fn: () => getPlugs() },
    { type: 'raspi', fn: () => raspiClient.getHealth() },
    { type: 'thermorossi', fn: () => getThermorossiHealth() },
  ];
  const slots = providerFilter === null
    ? allSlots
    : allSlots.filter(s => s.type === providerFilter);

  const results = await Promise.allSettled(slots.map(s => s.fn()));

  // --- Map results to items + errors[] ---
  const items: Device[] = [];
  const errors: DeviceAggregatorError[] = [];

  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i]!;
    const result = results[i]!;

    if (slot.type === 'raspi') {
      items.push(...mapRaspi(result));
      // Single-item provider: NEVER push to errors[] (Pitfall 4).
      continue;
    }
    if (slot.type === 'thermorossi') {
      items.push(...mapThermorossi(result as PromiseSettledResult<Awaited<ReturnType<typeof getThermorossiHealth>>>));
      // Single-item provider: NEVER push to errors[] (Pitfall 4).
      continue;
    }

    if (result.status === 'rejected') {
      // Pitfall 6: sanitize message — handle non-Error rejections.
      const message = result.reason instanceof Error ? result.reason.message : String(result.reason);
      errors.push({ provider_type: slot.type, message });
      console.warn(`[Devices/Aggregated] ${slot.type} failed:`, message);
      continue;
    }

    // Fulfilled multi-item provider — dispatch to mapper.
    switch (slot.type) {
      case 'fritzbox':
        items.push(...mapFritzbox(result.value as Awaited<ReturnType<typeof fritzboxClient.getDevices>>));
        break;
      case 'hue':
        items.push(...mapHue(result.value as Awaited<ReturnType<typeof getLights>>));
        break;
      case 'sonos':
        items.push(...mapSonos(result.value as Awaited<ReturnType<typeof getSonosDevices>>));
        break;
      case 'netatmo': {
        const [homesdata, cameras] = result.value as [
          Awaited<ReturnType<typeof getProxyHomesdata>>,
          Awaited<ReturnType<typeof getProxyCameraStatus>>,
        ];
        items.push(...mapNetatmo(homesdata, cameras));
        break;
      }
      case 'dirigera':
        items.push(...mapDirigera(result.value as Awaited<ReturnType<typeof getSensors>>));
        break;
      case 'tuya':
        items.push(...mapTuya(result.value as Awaited<ReturnType<typeof getPlugs>>));
        break;
    }
  }

  // --- Sort (D-17): provider_type ASC, then name ASC Italian-locale ---
  items.sort((a, b) => {
    const providerCmp = a.provider_type.localeCompare(b.provider_type);
    if (providerCmp !== 0) return providerCmp;
    return a.name.localeCompare(b.name, 'it');
  });

  // --- Paginate (D-16): total_count = pre-pagination merged length ---
  const total_count = items.length;
  const paged = items.slice(offset, offset + limit);

  return success({
    items: paged,
    total_count,
    limit,
    offset,
    errors,
  });
}, 'Devices/Aggregated');

// `SINGLE_ITEM_PROVIDERS` is exported only conceptually — used as documentation
// for the asymmetric handling in the loop above. Reference suppresses unused-var
// warnings in strict configurations without changing observable behavior.
void SINGLE_ITEM_PROVIDERS;
