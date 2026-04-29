'use client';
/**
 * PlugBody — Phase 179 Plan 05
 * Bundle source: rooms.jsx:396-405 + CONTEXT D-30 + D-55
 *
 * Read-only: 2 StatChips (Ora + Oggi).
 * Toggle is in DevicePrimaryControl header (D-25 / D-30).
 *
 * D-55 copy rules (frozen):
 * - Ora chip: power >= 1000W → "X.YkW" (no space); else "NW" (no space)
 * - Oggi chip: "{N.N} kWh" (with space)
 *
 * D-02: inline-style + var(--token) only. D-37: no useMemo/useCallback.
 */

import { StatChip } from '../primitives/StatChip';
import type { RoomDevice } from '../types';

function formatPower(watts: number): string {
  if (watts >= 1000) return `${(watts / 1000).toFixed(1)}kW`;
  return `${Math.round(watts)}W`;
}

export function PlugBody({ device }: { device: RoomDevice }): JSX.Element {
  const power = (device.extra.power as number | undefined) ?? 0;
  const todayKwh = (device.extra.today_kwh as number | undefined) ?? 0;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
      <StatChip label="Ora" value={formatPower(power)} tone={device.tone} />
      <StatChip label="Oggi" value={`${todayKwh.toFixed(1)} kWh`} tone={device.tone} />
    </div>
  );
}
