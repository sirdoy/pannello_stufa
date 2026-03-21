/**
 * Philips Hue Color Utilities
 * Convert RGB/HSL colors to XY CIE color space for Hue API
 * Based on Philips Hue documentation:
 * https://developers.meethue.com/develop/hue-api/lights-api/#color_gets_more_complicated
 *
 * Color detection uses proxy-native fields (capability_tier, hue, saturation)
 * instead of CLIP v2 nested objects.
 */

import type { HueLight } from '@/types/hueProxy';

export interface XYColor {
  x: number;
  y: number;
}

export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

export interface ColorPreset {
  name: string;
  hex: string;
  xy: XYColor;
  icon: string;
}

/**
 * Convert RGB (0-255) to XY CIE color space
 * @param red - Red value (0-255)
 * @param green - Green value (0-255)
 * @param blue - Blue value (0-255)
 * @returns XY coordinates in CIE color space
 */
export function rgbToXY(red: number, green: number, blue: number): XYColor {
  // Normalize RGB values to 0-1
  let r = red / 255;
  let g = green / 255;
  let b = blue / 255;

  // Apply gamma correction
  r = (r > 0.04045) ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = (g > 0.04045) ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b = (b > 0.04045) ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

  // Convert to XYZ using Wide RGB D65 conversion matrix
  const X = r * 0.664511 + g * 0.154324 + b * 0.162028;
  const Y = r * 0.283881 + g * 0.668433 + b * 0.047685;
  const Z = r * 0.000088 + g * 0.072310 + b * 0.986039;

  // Calculate xy from XYZ
  const sum = X + Y + Z;
  if (sum === 0) {
    return { x: 0, y: 0 };
  }

  const x = X / sum;
  const y = Y / sum;

  // Ensure values are within valid range (0-1)
  return {
    x: Math.max(0, Math.min(1, x)),
    y: Math.max(0, Math.min(1, y)),
  };
}

/**
 * Convert hex color to XY CIE
 * @param hex - Hex color (e.g., '#FF5733' or 'FF5733')
 * @returns XY coordinates
 */
export function hexToXY(hex: string): XYColor {
  // Remove # if present
  hex = hex.replace('#', '');

  // Parse RGB values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return rgbToXY(r, g, b);
}

/**
 * Preset colors for quick selection
 * Common colors with their XY CIE coordinates pre-calculated
 */
export const COLOR_PRESETS: ColorPreset[] = [
  {
    name: 'Bianco Caldo',
    hex: '#FFE4B5',
    xy: { x: 0.4448, y: 0.4066 },
    icon: '☀️',
  },
  {
    name: 'Bianco Freddo',
    hex: '#F0F8FF',
    xy: { x: 0.3227, y: 0.329 },
    icon: '❄️',
  },
  {
    name: 'Rosso',
    hex: '#FF0000',
    xy: { x: 0.6915, y: 0.3083 },
    icon: '🔴',
  },
  {
    name: 'Verde',
    hex: '#00FF00',
    xy: { x: 0.17, y: 0.7 },
    icon: '🟢',
  },
  {
    name: 'Blu',
    hex: '#0000FF',
    xy: { x: 0.1532, y: 0.0475 },
    icon: '🔵',
  },
  {
    name: 'Giallo',
    hex: '#FFFF00',
    xy: { x: 0.4432, y: 0.5154 },
    icon: '🟡',
  },
  {
    name: 'Arancione',
    hex: '#FFA500',
    xy: { x: 0.5614, y: 0.4156 },
    icon: '🟠',
  },
  {
    name: 'Viola',
    hex: '#9400D3',
    xy: { x: 0.2859, y: 0.1332 },
    icon: '🟣',
  },
  {
    name: 'Rosa',
    hex: '#FF69B4',
    xy: { x: 0.4338, y: 0.2468 },
    icon: '🩷',
  },
  {
    name: 'Ciano',
    hex: '#00FFFF',
    xy: { x: 0.1607, y: 0.3423 },
    icon: '🔵',
  },
];

/**
 * Convert HSL (h: 0-360, s: 0-100, l: 0-100) to hex color string
 */
function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

/**
 * Check if a light supports color (uses proxy capability_tier field)
 * @param light - Hue light object from proxy API
 * @returns True if light supports color
 */
export function supportsColor(light: HueLight): boolean {
  return light.capability_tier === 'color';
}

/**
 * Get current color as hex (approximate, using proxy hue/saturation fields)
 * @param light - Hue light object from proxy API
 * @returns Hex color or null if not a color-capable light
 */
export function getCurrentColorHex(light: HueLight): string | null {
  if (light.capability_tier !== 'color') return null;
  if (light.hue === null || light.saturation === null) return null;
  // Convert proxy hue (0-65535) to degrees (0-360)
  const hueDeg = (light.hue / 65535) * 360;
  // Convert proxy saturation (0-254) to percentage (0-100)
  const satPct = (light.saturation / 254) * 100;
  // Low saturation = warm white (matches current fallback behavior)
  if (satPct < 8) return '#FFE4B5';
  return hslToHex(hueDeg, satPct, 50);
}
