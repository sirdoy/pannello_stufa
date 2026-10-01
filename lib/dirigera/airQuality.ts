/**
 * Air quality helpers for the IKEA ALPSTUGA (DIRIGERA `environmentSensor`).
 *
 * Thresholds follow the IKEA indicator bands: PM2.5 0–35 / 36–85 / 86+ µg/m³
 * (VINDSTYRKA, same scale in the IKEA app), CO2 up to 1000 / 1600 / above ppm.
 */

import type { DirigeraSensor } from '@/types/dirigeraProxy';

export type AirLevel = 'good' | 'fair' | 'poor';

export const CO2_THRESHOLDS = { fair: 1000, poor: 1600 } as const;
export const PM25_THRESHOLDS = { fair: 36, poor: 86 } as const;

export const AIR_LEVEL_COLORS: Record<AirLevel, string> = {
  good: '#4ade80',
  fair: '#ffb84a',
  poor: '#ff4d5c',
};

export const AIR_LEVEL_LABELS: Record<AirLevel, string> = {
  good: 'Buona',
  fair: 'Discreta',
  poor: 'Scarsa',
};

const LEVEL_ORDER: AirLevel[] = ['good', 'fair', 'poor'];

function level(value: number | null | undefined, t: { fair: number; poor: number }): AirLevel | null {
  if (typeof value !== 'number') return null;
  if (value >= t.poor) return 'poor';
  if (value >= t.fair) return 'fair';
  return 'good';
}

export function co2Level(ppm: number | null | undefined): AirLevel | null {
  return level(ppm, CO2_THRESHOLDS);
}

export function pm25Level(ugm3: number | null | undefined): AirLevel | null {
  return level(ugm3, PM25_THRESHOLDS);
}

/** Worst of the CO2 and PM2.5 levels, null when neither is reported. */
export function airLevel(sensor: Pick<DirigeraSensor, 'co2' | 'pm25'>): AirLevel | null {
  const levels = [co2Level(sensor.co2), pm25Level(sensor.pm25)].filter(
    (l): l is AirLevel => l !== null,
  );
  if (levels.length === 0) return null;
  return levels.reduce((a, b) => (LEVEL_ORDER.indexOf(b) > LEVEL_ORDER.indexOf(a) ? b : a));
}

export function isAirSensor(sensor: Pick<DirigeraSensor, 'type'>): boolean {
  return sensor.type === 'environmentSensor';
}

export function formatTemperature(value: number | null | undefined): string {
  return typeof value === 'number' ? `${value.toFixed(1).replace('.', ',')}°` : '—';
}

export function formatHumidity(value: number | null | undefined): string {
  return typeof value === 'number' ? `${Math.round(value)}%` : '—';
}

export function formatCo2(value: number | null | undefined): string {
  return typeof value === 'number' ? `${Math.round(value)} ppm` : '—';
}

export function formatPm25(value: number | null | undefined): string {
  return typeof value === 'number' ? `${Math.round(value)} µg/m³` : '—';
}
