'use client';

/**
 * WeatherIcon Component
 *
 * Maps WMO weather codes (0-99) to Lucide React icons with day/night variants.
 * Uses filled/solid style icons for visual consistency.
 *
 * @see https://open-meteo.com/en/docs#weathervariables - WMO codes reference
 */

import {
  Sun,
  Moon,
  CloudSun,
  CloudMoon,
  Cloudy,
  CloudRain,
  CloudDrizzle,
  CloudSnow,
  CloudFog,
  CloudLightning,
} from 'lucide-react';

/**
 * WMO weather code to Lucide icon mapping
 * Each entry has day and night variants
 *
 * Code ranges:
 * 0-3: Clear to overcast
 * 45-48: Fog
 * 51-57: Drizzle
 * 61-67: Rain
 * 71-77: Snow
 * 80-86: Showers
 * 95-99: Thunderstorm
 */
const WMO_TO_LUCIDE = {
  // Clear sky
  0: { day: Sun, night: Moon, label: 'Sereno' },
  // Mainly clear
  1: { day: Sun, night: Moon, label: 'Prevalentemente sereno' },
  // Partly cloudy
  2: { day: CloudSun, night: CloudMoon, label: 'Parzialmente nuvoloso' },
  // Overcast
  3: { day: Cloudy, night: Cloudy, label: 'Coperto' },
  // Fog
  45: { day: CloudFog, night: CloudFog, label: 'Nebbia' },
  48: { day: CloudFog, night: CloudFog, label: 'Nebbia con brina' },
  // Drizzle
  51: { day: CloudDrizzle, night: CloudDrizzle, label: 'Pioviggine leggera' },
  53: { day: CloudDrizzle, night: CloudDrizzle, label: 'Pioviggine moderata' },
  55: { day: CloudDrizzle, night: CloudDrizzle, label: 'Pioviggine intensa' },
  56: { day: CloudDrizzle, night: CloudDrizzle, label: 'Pioviggine gelata leggera' },
  57: { day: CloudDrizzle, night: CloudDrizzle, label: 'Pioviggine gelata intensa' },
  // Rain
  61: { day: CloudRain, night: CloudRain, label: 'Pioggia leggera' },
  63: { day: CloudRain, night: CloudRain, label: 'Pioggia moderata' },
  65: { day: CloudRain, night: CloudRain, label: 'Pioggia intensa' },
  66: { day: CloudRain, night: CloudRain, label: 'Pioggia gelata leggera' },
  67: { day: CloudRain, night: CloudRain, label: 'Pioggia gelata intensa' },
  // Snow
  71: { day: CloudSnow, night: CloudSnow, label: 'Neve leggera' },
  73: { day: CloudSnow, night: CloudSnow, label: 'Neve moderata' },
  75: { day: CloudSnow, night: CloudSnow, label: 'Neve intensa' },
  77: { day: CloudSnow, night: CloudSnow, label: 'Granuli di neve' },
  // Showers
  80: { day: CloudRain, night: CloudRain, label: 'Rovesci leggeri' },
  81: { day: CloudRain, night: CloudRain, label: 'Rovesci moderati' },
  82: { day: CloudRain, night: CloudRain, label: 'Rovesci violenti' },
  // Snow showers
  85: { day: CloudSnow, night: CloudSnow, label: 'Rovesci di neve leggeri' },
  86: { day: CloudSnow, night: CloudSnow, label: 'Rovesci di neve intensi' },
  // Thunderstorm
  95: { day: CloudLightning, night: CloudLightning, label: 'Temporale' },
  96: { day: CloudLightning, night: CloudLightning, label: 'Temporale con grandine leggera' },
  99: { day: CloudLightning, night: CloudLightning, label: 'Temporale con grandine intensa' },
};

// Default fallback for unknown codes
const DEFAULT_ICON = { day: Sun, night: Moon, label: 'Sconosciuto' };

/**
 * Get Italian weather label for a WMO code
 * @param {number} code - WMO weather code (0-99)
 * @returns {string} Italian description of the weather condition
 *
 * @example
 * getWeatherLabel(0) // 'Sereno'
 * getWeatherLabel(95) // 'Temporale'
 * getWeatherLabel(999) // 'Sconosciuto'
 */
export function getWeatherLabel(code) {
  const iconData = WMO_TO_LUCIDE[code] || DEFAULT_ICON;
  return iconData.label;
}

/**
 * WeatherIcon Component
 *
 * Renders a Lucide weather icon based on WMO weather code.
 * Supports day/night variants and filled icon style.
 *
 * @param {Object} props
 * @param {number} props.code - WMO weather code (0-99)
 * @param {boolean} [props.isNight=false] - Use night variant icons
 * @param {string} [props.className] - Additional CSS classes
 * @param {number} [props.size=24] - Icon size in pixels
 *
 * @example
 * <WeatherIcon code={0} /> // Sun icon
 * <WeatherIcon code={0} isNight /> // Moon icon
 * <WeatherIcon code={61} size={32} className="text-blue-400" /> // Rain icon
 */
export default function WeatherIcon({
  code,
  isNight = false,
  className = '',
  size = 24,
}) {
  const iconData = WMO_TO_LUCIDE[code] || DEFAULT_ICON;
  const IconComponent = isNight ? iconData.night : iconData.day;
  const label = iconData.label;

  return (
    <IconComponent
      size={size}
      className={className}
      fill="currentColor"
      strokeWidth={0}
      aria-label={label}
      role="img"
    />
  );
}

// Named export for convenience
export { WeatherIcon };
