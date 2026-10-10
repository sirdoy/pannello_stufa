'use client';
/**
 * SensorBody — readings of an IKEA sensor (ROADMAP M84), from the live DIRIGERA payload:
 * air monitor (temperature, humidity, CO₂, PM2.5), window contact, motion.
 */

import { StatChip } from '../primitives/StatChip';
import type { DirigeraSensor } from '@/types/dirigeraProxy';
import type { RoomDevice } from '../types';

function chips(s: DirigeraSensor): Array<{ label: string; value: string }> {
  const out: Array<{ label: string; value: string }> = [];
  if (typeof s.is_open === 'boolean') out.push({ label: 'Stato', value: s.is_open ? 'Aperta' : 'Chiusa' });
  if (typeof s.is_detected === 'boolean') out.push({ label: 'Movimento', value: s.is_detected ? 'Sì' : 'No' });
  if (typeof s.light_level === 'number') out.push({ label: 'Luce', value: `${s.light_level} lx` });
  if (typeof s.temperature === 'number') out.push({ label: 'Temp.', value: `${s.temperature.toFixed(1)}°` });
  if (typeof s.humidity === 'number') out.push({ label: 'Umidità', value: `${Math.round(s.humidity)}%` });
  if (typeof s.co2 === 'number') out.push({ label: 'CO₂', value: `${Math.round(s.co2)} ppm` });
  if (typeof s.pm25 === 'number') out.push({ label: 'PM2.5', value: `${Math.round(s.pm25)} µg` });
  if (typeof s.battery_percentage === 'number') out.push({ label: 'Batteria', value: `${s.battery_percentage}%` });
  return out;
}

export function SensorBody({ device }: { device: RoomDevice }) {
  const sensor = device.extra['sensor'] as DirigeraSensor | undefined;
  if (!sensor) return null;
  const items = chips(sensor);
  if (items.length === 0) return null;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
      {items.map((c) => (
        <StatChip key={c.label} label={c.label} value={c.value} />
      ))}
    </div>
  );
}
