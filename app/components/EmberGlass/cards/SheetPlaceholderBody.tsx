'use client';

/**
 * SheetPlaceholderBody — Phase 177 (DASH-11 enabling helper).
 *
 * Single styled placeholder body for the per-card sheets shipped in Phase 177.
 * Phase 178 swaps the placeholder for real sheet bodies (SHEET-02..06) and
 * deletes this file.
 *
 * Italian copy frozen at:
 *   "Controlli in arrivo nella Phase {phase}"
 *   subtitle: "Stiamo cucinando."
 *
 * Device→icon map covers every interactive card mounted by Phase 177.
 */

import type { LucideIcon } from 'lucide-react';
import { Flame, Thermometer, Lightbulb, Music, Video, Wifi, Plug } from 'lucide-react';

const ICONS = {
  stove: Flame,
  thermostat: Thermometer,
  lights: Lightbulb,
  sonos: Music,
  camera: Video,
  network: Wifi,
  'plugs-tuya': Plug,
  'plugs-dirigera': Plug,
} satisfies Record<string, LucideIcon>;

export type SheetPlaceholderDevice = keyof typeof ICONS;

export interface SheetPlaceholderBodyProps {
  phase: string;
  device: SheetPlaceholderDevice;
}

export function SheetPlaceholderBody({ phase, device }: SheetPlaceholderBodyProps) {
  const Icon = ICONS[device] ?? Flame;
  return (
    <div
      data-testid="sheet-placeholder-body"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        padding: '24px 0',
      }}
    >
      <Icon size={32} strokeWidth={1.5} color="var(--text-2)" />
      <div style={{ fontSize: 14, color: 'var(--text-1)' }}>
        {`Controlli in arrivo nella Phase ${phase}`}
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-2)' }}>Stiamo cucinando.</div>
    </div>
  );
}
