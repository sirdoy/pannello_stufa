'use client';
/**
 * SensorBody — Phase 179 Plan 05
 * Bundle source: rooms.jsx:489-505 + CONTEXT D-35 + D-60
 *
 * Read-only: 2 StatChips (Valore + Trend).
 * Data comes from EXTRA_DEVICES static mock (D-07 — no live humidity sensor proxy).
 *
 * D-60 copy (frozen): chip labels "Valore" / "Trend"
 *
 * D-02: inline-style + var(--token) only. D-37: no useMemo/useCallback.
 */

import { StatChip } from '../primitives/StatChip';
import type { RoomDevice } from '../types';

export function SensorBody({ device }: { device: RoomDevice }){
  const humidity = (device.extra.humidity as number | undefined) ?? 0;
  const trend = (device.extra.trend as string | undefined) ?? 'stabile';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
      <StatChip label="Valore" value={`${humidity}%`} tone={device.tone} />
      <StatChip label="Trend" value={trend} tone={device.tone} />
    </div>
  );
}
