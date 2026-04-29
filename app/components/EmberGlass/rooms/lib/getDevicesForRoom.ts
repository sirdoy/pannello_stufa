/**
 * Phase 179 — Pure aggregator: maps real device-hook outputs to RoomDevice[] for a given room.
 *
 * Field reads honor RESEARCH.md §Aggregator Reconciliation (NOT the bundle's idealized shape).
 * Key reconciliation deviations:
 *   - Stove: no `temp` field from useStoveData; `value` uses `${powerLevel}/5` instead of temperature
 *   - Plugs: hardcoded to 'Cucina' until registry-join phase ships `useDeviceRegistry()` (CONTEXT D-14)
 *   - Sonos: volume command should use handleSetZoneVolume(id, value) per Phase 178 precedent (RESEARCH Pitfall 7)
 *
 * @remarks
 * Tuya plugs are statically assigned to 'Cucina' because TuyaPlug exposes no `room` field.
 * A future phase ships `useDeviceRegistry()` to join `/api/v1/registry/devices` with
 * `/api/v1/rooms`; at that point the static "Cucina" fallback in this aggregator is removed.
 * See CONTEXT D-14 + `.planning/phases/179-rooms-tab-redesign/179-CONTEXT.md §deferred`.
 *
 * No useMemo / useCallback — React Compiler 1.0 handles auto-memoization (D-66/67).
 * Pure synchronous function — no I/O, no side effects.
 */

import type { AggregatorState, DeviceKind, RoomDevice } from '../types';
import type { RoomConfig } from '../types';
import { CATEGORY_ORDER, EXTRA_DEVICES, ROOMS, ROOM_ALIASES } from './rooms-config';

/** Category-specific tone colors — mirrors bundle rooms.jsx TONE_FOR_KIND */
const TONE_FOR_KIND: Record<DeviceKind, string> = {
  stove:   'var(--accent)',
  thermo:  '#5eafff',
  valve:   '#5eafff',
  light:   '#f5c84a',
  plug:    '#ffb84a',
  sonos:   '#b080ff',
  tv:      '#5eafff',
  camera:  '#6aa86a',
  shade:   '#b0b0b0',
  sensor:  '#9a9a9a',
};

/**
 * Pure aggregator: maps real device-hook outputs to RoomDevice[] for a given canonical room name.
 *
 * @param state  AggregatorState literal built by RoomsTab orchestrator from the 5 device hooks
 * @param roomName  one of ROOMS[i].name (canonical 6-room set)
 * @returns ordered RoomDevice[] — live devices sorted by CATEGORY_ORDER, then EXTRA_DEVICES appended
 */
export function getDevicesForRoom(
  state: AggregatorState,
  roomName: RoomConfig['name'],
): RoomDevice[] {
  // Defensive: validate roomName is canonical (RESEARCH §T-179-01-01)
  if (!ROOMS.some((r) => r.name === roomName)) return [];

  const live: RoomDevice[] = [];

  // D-11: Stove → Soggiorno only
  if (roomName === 'Soggiorno' && state.stove) {
    const { on, powerLevel, fanLevel } = state.stove;
    live.push({
      kind:  'stove',
      name:  'Stufa Thermorossi',
      on,
      value: on ? `${powerLevel}/5` : 'Spenta',
      tone:  TONE_FOR_KIND.stove,
      extra: { on, powerLevel, fanLevel },
    });
  }

  // D-12: Thermostat zones → ROOM_ALIASES[zone.name]
  for (const z of state.thermostat?.zones ?? []) {
    const canonical = ROOM_ALIASES[z.name];
    if (canonical !== roomName) continue;
    live.push({
      kind:  z.kind,
      name:  z.name,
      on:    z.on,
      value: `${z.current.toFixed(1)}° → ${z.target.toFixed(1)}°`,
      tone:  TONE_FOR_KIND[z.kind],
      extra: { current: z.current, target: z.target, roomId: z.roomId, kind: z.kind },
    });
  }

  // D-13: Lights → ROOM_ALIASES[light.room_name], drop null room_name
  for (const l of state.lights?.lights ?? []) {
    if (l.room_name === null) continue;
    const canonical = ROOM_ALIASES[l.room_name];
    if (canonical !== roomName) {
      if (process.env.NODE_ENV === 'development' && !canonical) {
        // eslint-disable-next-line no-console
        console.warn('[rooms] unmatched light room_name', l.room_name);
      }
      continue;
    }
    live.push({
      kind:  'light',
      name:  l.name,
      on:    l.on,
      value: l.on ? `${l.brightness ?? 0}%` : 'Spenta',
      tone:  TONE_FOR_KIND.light,
      extra: { brightness: l.brightness ?? 0, groupId: l.groupId },
    });
  }

  // D-14: Plugs → static "Cucina" (TuyaPlug has no room field — see JSDoc above)
  if (roomName === 'Cucina') {
    for (const p of state.plugs?.plugs ?? []) {
      const watts =
        p.power >= 1000
          ? `${(p.power / 1000).toFixed(1)}kW`
          : `${Math.round(p.power)}W`;
      live.push({
        kind:  'plug',
        name:  p.name,
        on:    p.on,
        value: p.on ? watts : 'Spenta',
        tone:  TONE_FOR_KIND.plug,
        extra: { id: p.id, power: p.power, today_kwh: p.today_kwh ?? 0 },
      });
    }
  }

  // D-15: Sonos groups → ROOM_ALIASES[group.name]
  for (const g of state.sonos?.groups ?? []) {
    const canonical = ROOM_ALIASES[g.name];
    if (canonical !== roomName) {
      if (process.env.NODE_ENV === 'development' && !canonical) {
        // eslint-disable-next-line no-console
        console.warn('[rooms] unmatched sonos group name', g.name);
      }
      continue;
    }
    live.push({
      kind:  'sonos',
      name:  g.name,
      on:    g.playing,
      value: g.playing ? g.track : 'In pausa',
      tone:  TONE_FOR_KIND.sonos,
      extra: { id: g.id, coordinator: g.coordinator, track: g.track, artist: g.artist, volume: g.volume },
    });
  }

  // D-17: Order live devices per CATEGORY_ORDER (within a category, preserve hook-emission order)
  const byCategory: Partial<Record<DeviceKind, RoomDevice[]>> = {};
  for (const d of live) {
    (byCategory[d.kind] ??= []).push(d);
  }
  const ordered: RoomDevice[] = [];
  for (const cat of CATEGORY_ORDER) {
    const bucket = byCategory[cat];
    if (bucket) ordered.push(...bucket);
  }

  // D-16: Append EXTRA_DEVICES (mock) after live devices in stable order
  const extras = (EXTRA_DEVICES[roomName] ?? []).map(
    (e) => ({ ...e, mock: true } as RoomDevice),
  );

  return [...ordered, ...extras];
}
