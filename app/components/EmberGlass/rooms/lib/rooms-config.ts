/**
 * Rooms tab constants (ROADMAP M84): look of a room, icon and label of each device kind.
 *
 * Rooms are the ones stored on the Pi, so their look is derived from the name: a known room gets
 * its own icon and colour, any other room takes the next colour of the palette.
 */

import {
  Home,
  Sofa,
  CookingPot,
  BedDouble,
  Bath,
  DoorOpen,
  Warehouse,
  Package,
  Flame,
  Thermometer,
  Lightbulb,
  Plug,
  Music,
  Video,
  Radar,
  Server,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { DeviceKind, RoomConfig, RoomIcon } from '../types';

interface RoomLook {
  match: RegExp;
  icon: RoomIcon;
  tone: string;
}

const ROOM_LOOKS: RoomLook[] = [
  { match: /sala|salotto|soggiorno|living/i, icon: 'sofa', tone: 'var(--accent)' },
  { match: /cucina|kitchen/i, icon: 'kitchen', tone: '#f5c84a' },
  { match: /camera|letto|bedroom/i, icon: 'bed', tone: '#b080ff' },
  { match: /bagno|bath/i, icon: 'bath', tone: '#5ec8d8' },
  { match: /ingresso|corridoio|entrance|hall/i, icon: 'door', tone: '#ffb84a' },
  { match: /garage|box|cantina/i, icon: 'garage', tone: '#6aa86a' },
  { match: /ripostiglio|sgabuzzino|lavanderia/i, icon: 'box', tone: '#9a9a9a' },
  { match: /casa|home|ovunque/i, icon: 'home', tone: '#5eafff' },
];

const FALLBACK_TONES = ['#5eafff', '#b080ff', '#f5c84a', '#6aa86a', '#ffb84a', '#5ec8d8'];

/** Icon and colour of a room from its name; `index` picks the colour of an unknown room. */
export function roomConfig(id: number, name: string, index: number): RoomConfig {
  const look = ROOM_LOOKS.find((l) => l.match.test(name));
  return {
    id,
    name,
    icon: look?.icon ?? 'home',
    tone: look?.tone ?? FALLBACK_TONES[index % FALLBACK_TONES.length]!,
  };
}

export const ICON_FOR: Record<DeviceKind | RoomIcon, LucideIcon> = {
  stove: Flame,
  thermo: Thermometer,
  valve: Thermometer,
  light: Lightbulb,
  plug: Plug,
  sonos: Music,
  camera: Video,
  sensor: Radar,
  host: Server,
  home: Home,
  sofa: Sofa,
  kitchen: CookingPot,
  bed: BedDouble,
  bath: Bath,
  door: DoorOpen,
  garage: Warehouse,
  box: Package,
};

/** Colour of a device kind (chip and card tint) */
export const TONE_FOR_KIND: Record<DeviceKind, string> = {
  stove: 'var(--accent)',
  thermo: '#5eafff',
  valve: '#5eafff',
  light: '#f5c84a',
  plug: '#ffb84a',
  sonos: '#b080ff',
  camera: '#6aa86a',
  sensor: '#5ec8d8',
  host: '#9a9a9a',
};

/** Display order of the device kinds inside a room */
export const CATEGORY_ORDER: DeviceKind[] = [
  'stove', 'thermo', 'valve', 'light', 'plug', 'sonos', 'camera', 'sensor', 'host',
];

export const CATEGORY_LABEL: Record<DeviceKind, string> = {
  stove: 'Stufa',
  thermo: 'Termostato',
  valve: 'Termovalvole',
  light: 'Luci',
  plug: 'Prese',
  sonos: 'Audio',
  camera: 'Telecamera',
  sensor: 'Sensori',
  host: 'Sistema',
};
