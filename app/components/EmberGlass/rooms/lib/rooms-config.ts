/**
 * Phase 179 — Static rooms registry + supporting constants.
 *
 * Bundle source: rooms.jsx:6-55 (values lifted verbatim).
 * All exports are pure constants — no React, no JSX, no useMemo/useCallback.
 *
 * CONTEXT decisions:
 *   D-05 — ROOMS 6-entry frozen tuple
 *   D-06 — ROOM_ALIASES: string → canonical room name
 *   D-07 — EXTRA_DEVICES: mock entries per room (mock: true flag in aggregator)
 *   D-08 — ICON_FOR: DeviceKind + room icon → lucide-react component
 *   D-09 — CATEGORY_ORDER + CATEGORY_LABEL (frozen Italian copy)
 *
 * No Tailwind — CONTEXT D-02. Inline-style + var(--token) convention.
 */

import {
  Home,
  Moon,
  Droplets,
  Flame,
  Thermometer,
  Lightbulb,
  Plug,
  Music,
  Tv,
  Video,
  Blinds,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { DeviceKind, RoomConfig, RoomDevice } from '../types';

// CONTEXT D-05 — verbatim from rooms.jsx:6-13
export const ROOMS = [
  { name: 'Soggiorno', tone: 'var(--accent)', icon: 'home' },
  { name: 'Cucina',    tone: '#f5c84a',       icon: 'home' },
  { name: 'Camera',    tone: '#b080ff',       icon: 'moon' },
  { name: 'Studio',    tone: '#5eafff',       icon: 'home' },
  { name: 'Bagno',     tone: '#6aa86a',       icon: 'droplet' },
  { name: 'Ingresso',  tone: '#ffb84a',       icon: 'home' },
] as const satisfies readonly RoomConfig[];

// CONTEXT D-06 — verbatim from rooms.jsx:16-29 extended with discovered aliases per RESEARCH §Aggregator Reconciliation
export const ROOM_ALIASES: Record<string, RoomConfig['name']> = {
  Soggiorno: 'Soggiorno',
  Salone: 'Soggiorno',
  Living: 'Soggiorno',
  LivingRoom: 'Soggiorno',
  'Sala da pranzo': 'Soggiorno',
  Cucina: 'Cucina',
  Kitchen: 'Cucina',
  Camera: 'Camera',
  'Camera da letto': 'Camera',
  Bedroom: 'Camera',
  Studio: 'Studio',
  Office: 'Studio',
  Ufficio: 'Studio',
  Bagno: 'Bagno',
  Bathroom: 'Bagno',
  Ingresso: 'Ingresso',
  Entrance: 'Ingresso',
  Hallway: 'Ingresso',
  Corridoio: 'Ingresso',
};

// CONTEXT D-07 — verbatim mocks from rooms.jsx:32-49
// Each entry is flagged `mock: true` by the aggregator when appended.
export const EXTRA_DEVICES: Partial<Record<RoomConfig['name'], Array<Omit<RoomDevice, 'mock'>>>> = {
  Soggiorno: [
    { kind: 'tv',    name: 'TV soggiorno',   on: true,  value: 'HDMI 1', tone: '#5eafff', extra: { source: 'HDMI 1', volume: 32 } },
    { kind: 'shade', name: 'Tapparella sud',  on: false, value: '60%',   tone: '#b0b0b0', extra: { position: 60 } },
  ],
  Camera: [
    { kind: 'shade', name: 'Tapparella camera', on: false, value: '40%', tone: '#b0b0b0', extra: { position: 40 } },
  ],
  Bagno: [
    { kind: 'sensor', name: 'Umidità bagno', on: true, value: '58%', tone: '#9a9a9a', extra: { humidity: 58, trend: 'stabile' } },
  ],
  Ingresso: [
    { kind: 'camera', name: 'Telecamera ingresso', on: true, value: 'LIVE', tone: '#6aa86a', extra: { fps: 24, motion: 'rilevato 2m fa' } },
  ],
};

// CONTEXT D-08 — DeviceKind + room icon → lucide-react component (rooms.jsx:51-55)
export const ICON_FOR: Record<DeviceKind | RoomConfig['icon'], LucideIcon> = {
  stove:   Flame,
  thermo:  Thermometer,
  valve:   Thermometer,
  light:   Lightbulb,
  plug:    Plug,
  sonos:   Music,
  tv:      Tv,
  camera:  Video,
  shade:   Blinds,
  sensor:  Droplets,
  home:    Home,
  moon:    Moon,
  droplet: Droplets,
};

// CONTEXT D-09 — frozen device kind display order
export const CATEGORY_ORDER: DeviceKind[] = [
  'stove', 'thermo', 'valve', 'light', 'plug', 'sonos', 'tv', 'camera', 'shade', 'sensor',
];

// CONTEXT D-09 — frozen Italian category labels
export const CATEGORY_LABEL: Record<DeviceKind, string> = {
  stove:   'Stufa',
  thermo:  'Termostato',
  valve:   'Termovalvole',
  light:   'Luci',
  plug:    'Prese',
  sonos:   'Audio',
  tv:      'TV',
  camera:  'Telecamera',
  shade:   'Tapparelle',
  sensor:  'Sensori',
};
