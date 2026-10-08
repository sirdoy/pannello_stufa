/**
 * Motion sensor helpers for the IKEA MYGGSPRAY (DIRIGERA `occupancySensor`).
 *
 * One sensor carries two readings: motion (`is_detected`) and illuminance
 * (`light_level`, lux, merged by the backend from the companion `lightSensor`).
 */

import type { DirigeraSensor } from '@/types/dirigeraProxy';

export function isMotionSensor(sensor: Pick<DirigeraSensor, 'type'>): boolean {
  return sensor.type === 'occupancySensor' || sensor.type === 'motionSensor';
}

export function motionLabel(sensor: Pick<DirigeraSensor, 'is_detected'>): string {
  return sensor.is_detected === true ? 'Movimento' : 'Fermo';
}

/** `3 lux`; null when the sensor has no light reading (0 is a real reading: dark). */
export function formatLux(value: number | null | undefined): string | null {
  return typeof value === 'number' ? `${Math.round(value)} lux` : null;
}

/** `Movimento · 3 lux`, or only the motion state without a light reading. */
export function motionSummary(sensor: Pick<DirigeraSensor, 'is_detected' | 'light_level'>): string {
  const lux = formatLux(sensor.light_level);
  return lux === null ? motionLabel(sensor) : `${motionLabel(sensor)} · ${lux}`;
}
