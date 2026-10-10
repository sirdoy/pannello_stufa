'use client';

/**
 * RoomCard — Phase 179 (ROOMS-02 / CONTEXT D-18..D-19); rooms come from the Pi since M84.
 *
 * Chip-grid card: GlassCard (Phase 177) + CardHead (Phase 177) +
 * 3-col DeviceChip grid of six cells (the last one is the "+N" counter when there are more
 * devices) + empty state.
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

const MAX_CELLS = 6;

export function RoomCard({ room, devices, onOpen }: RoomCardProps){
  const Icon = ICON_FOR[room.icon];
  const activeCount = devices.filter((d) => d.on).length;
  const total = devices.length;
  // Six cells (two rows of three): with more devices the last cell is the "+N" counter
  const visible = total > MAX_CELLS ? devices.slice(0, MAX_CELLS - 1) : devices;
  const overflowCount = total - visible.length;

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
      data-testid={`room-card-${room.id}`}
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
            {visible.map((d) => (
              <DeviceChip key={d.id} device={d} />
            ))}
            {overflowCount > 0 ? (
              <div
                data-testid={`room-card-${room.id}-overflow`}
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
