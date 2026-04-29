'use client';
/**
 * TvBody — Phase 179 Plan 05
 * Bundle source: rooms.jsx:423-447 + CONTEXT D-32 + D-57
 *
 * No-op interactive: 2 StatChips (Sorgente/Volume) + HDMI 1/HDMI 2/App ControlRow.
 * No TV proxy exists — all click handlers are no-ops (CONTEXT D-32).
 *
 * D-57 copy (frozen): chip labels "Sorgente" / "Volume"; buttons "HDMI 1" / "HDMI 2" / "App"
 *
 * D-02: inline-style + var(--token) only. D-37: no useMemo/useCallback. D-67: inline handlers.
 */

import { StatChip } from '../primitives/StatChip';
import { ControlRow } from '../primitives/ControlRow';
import { MiniButton } from '../primitives/MiniButton';
import type { RoomDevice } from '../types';

export function TvBody({ device }: { device: RoomDevice }){
  const source = (device.extra.source as string | undefined) ?? '—';
  const volume = (device.extra.volume as number | undefined) ?? 0;
  // No-op: no TV proxy (CONTEXT D-32 Out of Scope)
  const noop = () => undefined;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
        <StatChip label="Sorgente" value={source} tone={device.tone} />
        <StatChip label="Volume" value={String(volume)} tone={device.tone} />
      </div>
      <ControlRow>
        <MiniButton
          label="HDMI 1"
          filled={source === 'HDMI 1'}
          tone={device.tone}
          onClick={noop}
        />
        <MiniButton
          label="HDMI 2"
          filled={source === 'HDMI 2'}
          tone={device.tone}
          onClick={noop}
        />
        <MiniButton
          label="App"
          filled={source === 'App'}
          tone={device.tone}
          onClick={noop}
        />
      </ControlRow>
    </div>
  );
}
