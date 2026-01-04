/**
 * Philips Hue Color Utilities
 * Convert RGB/HSL colors to XY CIE color space for Hue API
 * Based on Philips Hue documentation:
 * https://developers.meethue.com/develop/hue-api/lights-api/#color_gets_more_complicated
 */

/**
 * Convert RGB (0-255) to XY CIE color space
 * @param {number} red - Red value (0-255)
 * @param {number} green - Green value (0-255)
 * @param {number} blue - Blue value (0-255)
 * @returns {{x: number, y: number}} XY coordinates in CIE color space
 */
export function rgbToXY(red, green, blue) {
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
 * @param {string} hex - Hex color (e.g., '#FF5733' or 'FF5733')
 * @returns {{x: number, y: number}} XY coordinates
 */
export function hexToXY(hex) {
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
export const COLOR_PRESETS = [
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
 * Check if a light supports color
 * @param {object} light - Hue light object from API
 * @returns {boolean} True if light supports color
 */
export function supportsColor(light) {
  return !!(light?.color?.gamut || light?.color?.xy);
}

/**
 * Get current color as hex (approximate)
 * @param {object} light - Hue light object
 * @returns {string|null} Hex color or null if no color
 */
export function getCurrentColorHex(light) {
  if (!light?.color?.xy) return null;

  const { x, y } = light.color.xy;

  // Convert XY back to RGB (approximate)
  const z = 1.0 - x - y;
  const Y = 1.0; // Assume full brightness
  const X = (Y / y) * x;
  const Z = (Y / y) * z;

  // Convert to RGB
  let r = X * 1.656492 - Y * 0.354851 - Z * 0.255038;
  let g = -X * 0.707196 + Y * 1.655397 + Z * 0.036152;
  let b = X * 0.051713 - Y * 0.121364 + Z * 1.011530;

  // Apply reverse gamma correction
  r = (r <= 0.0031308) ? 12.92 * r : 1.055 * Math.pow(r, 1.0 / 2.4) - 0.055;
  g = (g <= 0.0031308) ? 12.92 * g : 1.055 * Math.pow(g, 1.0 / 2.4) - 0.055;
  b = (b <= 0.0031308) ? 12.92 * b : 1.055 * Math.pow(b, 1.0 / 2.4) - 0.055;

  // Clamp to 0-255
  r = Math.max(0, Math.min(255, Math.round(r * 255)));
  g = Math.max(0, Math.min(255, Math.round(g * 255)));
  b = Math.max(0, Math.min(255, Math.round(b * 255)));

  // Convert to hex
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}
