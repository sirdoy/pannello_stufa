'use client';

/**
 * RoomCard — Phase 179 (ROOMS-02 / CONTEXT D-18..D-19)
 *
 * Chip-grid card: GlassCard (Phase 177) + CardHead (Phase 177) +
 * 3-col DeviceChip grid (≤6 chips) + "+N" overflow chip + empty state.
 *
 * Visual contract verbatim from bundle `rooms.jsx:158-189`.
 *
 * Interactivity: `<GlassCard onOpen={onOpen}>` internally wraps in the press
 * animation primitive (Phase 177 GlassCard.tsx:83-92). No manual outer wrap
 * needed (CONTEXT D-19 + RESEARCH §Pitfall + §Pattern 3).
 *
 * Count badge: uses `room.tone` when activeCount > 0, `var(--text-2)` otherwise
 * (bundle rooms.jsx:166-168 / CONTEXT D-18).
 *
 * RC-clean — no manual memoization hooks (CONTEXT D-66, React Compiler discipline).
 */

import { GlassCard } from '../GlassCard';
import { CardHead } from '../CardHead';
import { DeviceChip } from './DeviceChip';
import { ICON_FOR } from './lib/rooms-config';
import type { RoomConfig, RoomDevice } from './types';

export interface RoomCardProps {
  room: RoomConfig;
  devices: RoomDevice[];
  onOpen: () => void;
}

export function RoomCard({ room, devices, onOpen }: RoomCardProps){
  const Icon = ICON_FOR[room.icon];
  const activeCount = devices.filter((d) => d.on).length;
  const total = devices.length;
  const visible = devices.slice(0, 6);
  const overflowCount = Math.max(0, total - 6);

  const countBadge = (
    <span
      style={{
        fontSize: 13,
        fontVariantNumeric: 'tabular-nums',
        color: activeCount > 0 ? room.tone : 'var(--text-2)',
      }}
    >
      {activeCount}/{total}
    </span>
  );

  return (
    <GlassCard
      tone={room.tone}
      onOpen={onOpen}
      data-testid={`room-card-${room.name.toLowerCase()}`}
    >
      <CardHead Icon={Icon} label={room.name} tone={room.tone} right={countBadge} />
      <div style={{ marginTop: 10, flex: 1 }}>
        {total === 0 ? (
          <div
            style={{
              padding: '14px 0',
              textAlign: 'center',
              fontSize: 11,
              color: 'var(--text-2)',
            }}
          >
            Nessun dispositivo
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 6,
              alignContent: 'start',
            }}
          >
            {visible.map((d, i) => (
              <DeviceChip key={`${d.kind}-${d.name}-${i}`} device={d} />
            ))}
            {overflowCount > 0 ? (
              <div
                data-testid={`room-card-${room.name.toLowerCase()}-overflow`}
                aria-label={`${overflowCount} altri dispositivi`}
                style={{
                  aspectRatio: '1 / 1',
                  borderRadius: 10,
                  border: '0.5px dashed rgba(255,255,255,0.18)', // AUDIT-EXCEPTION (rooms.jsx:185)
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-2)',
                  fontSize: 12,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                +{overflowCount}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </GlassCard>
  );
}
