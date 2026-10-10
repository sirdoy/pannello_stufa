'use client';
/**
 * PlugBody — readings of a smart plug: power now and energy counter.
 * The switch is in the card header (DevicePrimaryControl).
 */

import { StatChip } from '../primitives/StatChip';
import type { RoomDevice } from '../types';

function formatPower(watts: number): string {
  if (watts >= 1000) return `${(watts / 1000).toFixed(1)}kW`;
  return `${Math.round(watts)}W`;
}

export function PlugBody({ device }: { device: RoomDevice }){
  const power = (device.extra.power as number | undefined) ?? 0;
  const energy = (device.extra.today_kwh as number | undefined) ?? 0;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
      <StatChip label="Ora" value={formatPower(power)} tone={device.tone} />
      <StatChip label="Energia" value={`${energy.toFixed(1)} kWh`} tone={device.tone} />
    </div>
  );
}
