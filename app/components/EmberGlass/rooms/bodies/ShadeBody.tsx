'use client';
/**
 * ShadeBody — Phase 179 Plan 05
 * Bundle source: rooms.jsx:449-465 + CONTEXT D-33 + D-58
 *
 * No-op interactive: SliderRow (Posizione %) + Su/Stop/Giù ControlRow.
 * No shade proxy exists — all click handlers are no-ops (CONTEXT D-33).
 *
 * D-58 copy (frozen): label "Posizione"; buttons "Su" / "Stop" / "Giù"
 *
 * D-02: inline-style + var(--token) only. D-37: no useMemo/useCallback. D-67: inline handlers.
 */

import { ChevronUp, ChevronDown } from 'lucide-react';
import { SliderRow } from '../primitives/SliderRow';
import { ControlRow } from '../primitives/ControlRow';
import { MiniButton } from '../primitives/MiniButton';
import type { RoomDevice } from '../types';

export function ShadeBody({ device }: { device: RoomDevice }): JSX.Element {
  const position = (device.extra.position as number | undefined) ?? 0;
  // No-op: no shade proxy (CONTEXT D-33 Out of Scope)
  const noop = () => undefined;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <SliderRow
        label="Posizione"
        value={position}
        unit="%"
        tone={device.tone}
        // Read-only — no onChange; shade proxy does not exist
      />
      <ControlRow>
        <MiniButton Icon={ChevronUp} label="Su" onClick={noop} />
        <MiniButton label="Stop" onClick={noop} />
        <MiniButton Icon={ChevronDown} label="Giù" onClick={noop} />
      </ControlRow>
    </div>
  );
}
