'use client';
/**
 * DeviceCard — Plan 179-04 (ROOMS-04 / CONTEXT D-23/D-24/D-61)
 *
 * Outer container for a device row inside RoomSheet's per-category sections.
 * Wraps in <Pressable as="div"> with NO onClick — per strict reading of Phase 175
 * SC-#1 ("every NEW glass surface in Phases 177-181 reuses Pressable") combined
 * with CONTEXT D-61 (Claude's Discretion: wrap even with no card-level click action).
 *
 * Visual contract: bundle rooms.jsx:276-317 (verbatim shape).
 * Inline-style + var(--token) — CONTEXT D-02. No Tailwind in this file.
 * No useMemo/useCallback — Phase 71/95/178 D-33 React Compiler discipline.
 *
 * DeviceBody ships in Plan 08 (Wave 3) — import resolves at integration time.
 * DeviceCard.test.tsx mocks ./DeviceBody so this component is independently green.
 */

import { Pressable } from '../Pressable';
import { ICON_FOR } from './lib/rooms-config';
import { DevicePrimaryControl } from './DevicePrimaryControl';
import { DeviceBody } from './DeviceBody';
import type { RoomDevice } from './types';

export interface DeviceCardProps {
  device: RoomDevice;
}

export function DeviceCard({ device }: DeviceCardProps): JSX.Element {
  const Icon = ICON_FOR[device.kind];
  const tone = device.tone;
  const slug = `${device.kind}-${device.name.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <Pressable
      as="div"
      data-testid={`stanze-device-${slug}`}
      style={{
        borderRadius: 16,
        padding: 14,
        background: device.on
          ? `linear-gradient(135deg, color-mix(in oklab, ${tone} 14%, transparent) 0%, transparent 70%)` // AUDIT-EXCEPTION (rooms.jsx:280)
          : 'rgba(255,255,255,0.03)', // AUDIT-EXCEPTION (rooms.jsx:281)
        border: device.on
          ? `0.5px solid color-mix(in oklab, ${tone} 25%, transparent)`
          : '0.5px solid rgba(255,255,255,0.06)', // AUDIT-EXCEPTION (rooms.jsx:282)
      }}
    >
      {/* Header row — bundle rooms.jsx:282-309 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        {/* 40×40 icon tile */}
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: device.on
              ? `color-mix(in oklab, ${tone} 22%, transparent)` // AUDIT-EXCEPTION (rooms.jsx:290)
              : 'rgba(255,255,255,0.05)', // AUDIT-EXCEPTION (rooms.jsx:291)
            border: device.on
              ? `0.5px solid color-mix(in oklab, ${tone} 30%, transparent)`
              : '0.5px solid rgba(255,255,255,0.06)',
            color: device.on ? tone : 'var(--text-2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: device.on
              ? `0 0 14px color-mix(in oklab, ${tone} 35%, transparent)`
              : 'none',
          }}
        >
          <Icon size={18} strokeWidth={2} />
        </div>

        {/* Name + status line */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>{device.name}</div>
          <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 2 }}>
            {device.on ? 'Attivo' : 'Inattivo'}
            {device.value ? ` · ${device.value}` : ''}
          </div>
        </div>

        {/* Right-slot: DevicePrimaryControl */}
        <DevicePrimaryControl device={device} />
      </div>

      {/* Body slot — DeviceBody ships in Plan 08 (Wave 3) */}
      <DeviceBody device={device} />
    </Pressable>
  );
}
