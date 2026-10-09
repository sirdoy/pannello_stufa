import { createElement } from 'react';
import {
  Camera, Cpu, Flame, Lightbulb, Music, Package, Phone, Plug, Sun, Thermometer, Wifi, HelpCircle,
  type LucideIcon, type LucideProps,
} from 'lucide-react';

/** Device / card id from the registry (lib/devices/deviceTypes.ts) → icon */
const DEVICE_ICONS: Record<string, LucideIcon> = {
  stove: Flame,
  thermostat: Thermometer,
  camera: Camera,
  lights: Lightbulb,
  sonos: Music,
  network: Wifi,
  raspi: Cpu,
  dirigera: Package,
  tuya: Plug,
  telefonia: Phone,
  weather: Sun,
};

export function getDeviceIcon(device: string): LucideIcon {
  return DEVICE_ICONS[device] ?? HelpCircle;
}

export interface DeviceIconProps extends LucideProps {
  /** Device or dashboard-card id (`stove`, `lights`, `weather`, …) */
  device: string;
}

/**
 * DeviceIcon — the icon of a device, picked from its id (workspace ROADMAP M75).
 * The registry still carries an emoji per device: pages never print it, they render this component.
 */
export default function DeviceIcon({ device, size = 22, ...props }: DeviceIconProps) {
  return createElement(getDeviceIcon(device), { size, 'aria-hidden': true, ...props });
}
