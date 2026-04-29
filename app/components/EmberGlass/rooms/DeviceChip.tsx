'use client';

/**
 * DeviceChip — Phase 179 (ROOMS-02 / CONTEXT D-20)
 *
 * 1:1 aspect-ratio chip used inside RoomCard's 3-col chip grid.
 * Visual contract verbatim from bundle `rooms.jsx:191-211`.
 *
 * On-state: color-mix(in oklab, ${tone} 18%, transparent) background +
 *           0.5px tone-tinted border + 5×5 glow dot pinned top:3 right:3.
 * Off-state: rgba(255,255,255,0.04) background + 0.5px dim border.
 *
 * Non-clickable — taps bubble to parent RoomCard (CONTEXT D-20 + D-62).
 * RC-clean — no manual memoization hooks (CONTEXT D-66, React Compiler discipline).
 */

import { ICON_FOR } from './lib/rooms-config';
import type { RoomDevice } from './types';

export interface DeviceChipProps {
  device: RoomDevice;
}

export function DeviceChip({ device }: DeviceChipProps): JSX.Element {
  const Icon = ICON_FOR[device.kind];
  const tone = device.tone;
  const on = device.on;

  return (
    <div
      data-testid={`device-chip-${device.kind}`}
      data-on={String(on)}
      style={{
        aspectRatio: '1 / 1',
        borderRadius: 10,
        position: 'relative',
        background: on
          ? `color-mix(in oklab, ${tone} 18%, transparent)`
          : 'rgba(255,255,255,0.04)', // AUDIT-EXCEPTION (rooms.jsx:200)
        border: on
          ? `0.5px solid color-mix(in oklab, ${tone} 35%, transparent)`
          : '0.5px solid rgba(255,255,255,0.06)', // AUDIT-EXCEPTION (rooms.jsx:201)
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: on ? tone : 'var(--text-2)',
      }}
    >
      <Icon size={14} strokeWidth={2} />
      {on ? (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 3,
            right: 3,
            width: 5,
            height: 5,
            borderRadius: 999,
            background: tone,
            boxShadow: `0 0 6px ${tone}`,
          }}
        />
      ) : null}
    </div>
  );
}
