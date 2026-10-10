'use client';
/**
 * HostBody — readings of the Raspberry Pi (ROADMAP M84): CPU, temperature, memory.
 */

import { StatChip } from '../primitives/StatChip';
import type { RoomDevice } from '../types';

function percent(v: unknown): string {
  return typeof v === 'number' ? `${Math.round(v)}%` : '—';
}

export function HostBody({ device }: { device: RoomDevice }) {
  const temperature = device.extra['temperature'];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
      <StatChip label="CPU" value={percent(device.extra['cpu'])} />
      <StatChip label="Temp." value={typeof temperature === 'number' ? `${temperature.toFixed(0)}°` : '—'} />
      <StatChip label="RAM" value={percent(device.extra['memory'])} />
    </div>
  );
}
