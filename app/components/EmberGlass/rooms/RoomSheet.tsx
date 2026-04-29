'use client';
/**
 * RoomSheet — Phase 179 (Plan 179-08 / ROOMS-03 / CONTEXT D-21..D-22 / D-49)
 *
 * Sheet wrapper + summary header + per-category DeviceCard sections.
 * Wraps the Phase 175 Sheet primitive internally; accepts { open, onClose, room, devices }.
 *
 * Props diverge from Phase 178 prop-less convention (D-22): RoomSheet is
 * orchestrator-fed — RoomsTab owns selectedRoomName state and passes derived
 * room + devices down.
 *
 * Visual contract: bundle rooms.jsx:217-273 (summary header + category sections).
 * Italian copy frozen per D-49: "{activeCount} di {total} attivi", "{N} categorie di dispositivi".
 * RC-clean: pure derivation only, no manual memo hooks (D-66/D-67).
 */

import { Sheet } from '../Sheet';
import { ICON_FOR, CATEGORY_ORDER, CATEGORY_LABEL } from './lib/rooms-config';
import { DeviceCard } from './DeviceCard';
import type { DeviceKind, RoomConfig, RoomDevice } from './types';

export interface RoomSheetProps {
  open: boolean;
  onClose: () => void;
  room: RoomConfig | null;
  devices: RoomDevice[];
}

function groupByKind(
  devices: RoomDevice[]
): Partial<Record<DeviceKind, RoomDevice[]>> {
  const out: Partial<Record<DeviceKind, RoomDevice[]>> = {};
  for (const d of devices) (out[d.kind] ??= []).push(d);
  return out;
}

export function RoomSheet({
  open,
  onClose,
  room,
  devices,
}: RoomSheetProps){
  if (!room) {
    return <Sheet open={false} onClose={onClose} />;
  }

  const Icon = ICON_FOR[room.icon];
  const activeCount = devices.filter((d) => d.on).length;
  const total = devices.length;
  const grouped = groupByKind(devices);
  const categoriesPresent: DeviceKind[] = CATEGORY_ORDER.filter(
    (k) => (grouped[k]?.length ?? 0) > 0
  );

  return (
    <Sheet open={open} onClose={onClose} title={room.name}>
      <div data-testid={`stanze-sheet-${room.name.toLowerCase()}`}>
        {/* Summary header — bundle rooms.jsx:234-257 */}
        <div
          style={{
            borderRadius: 18,
            padding: 16,
            background: `linear-gradient(130deg, color-mix(in oklab, ${room.tone} 16%, transparent) 0%, transparent 70%)`,
            border: `0.5px solid color-mix(in oklab, ${room.tone} 25%, transparent)`,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            marginBottom: 18,
          }}
        >
          {/* 42×42 icon tile */}
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 14,
              background: `color-mix(in oklab, ${room.tone} 22%, transparent)`,
              border: `0.5px solid color-mix(in oklab, ${room.tone} 30%, transparent)`,
              color: room.tone,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon size={20} strokeWidth={2} />
          </div>

          <div style={{ flex: 1 }}>
            {/* D-49: frozen Italian copy "{activeCount} di {total} attivi" at 16px display */}
            <div style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>
              {activeCount} di {total} attivi
            </div>
            {/* D-49: "{N} categorie di dispositivi" at 12px dim */}
            <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>
              {categoriesPresent.length} categorie di dispositivi
            </div>
          </div>
        </div>

        {/* Per-category sections — bundle rooms.jsx:259-270 */}
        {categoriesPresent.map((cat) => (
          <section key={cat} style={{ marginTop: 18 }}>
            <div
              style={{
                fontSize: 11,
                color: 'var(--text-2)',
                textTransform: 'uppercase',
                letterSpacing: 1,
                marginBottom: 10,
              }}
            >
              {CATEGORY_LABEL[cat]}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {grouped[cat]!.map((d, i) => (
                <DeviceCard key={`${cat}-${i}`} device={d} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </Sheet>
  );
}
