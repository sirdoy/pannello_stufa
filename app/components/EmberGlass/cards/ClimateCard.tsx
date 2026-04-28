'use client';

/**
 * ClimateCard — Phase 177 (DASH-03)
 *
 * Dashboard summary tile for the Netatmo thermostat. Lists up to 4 zones
 * (status dot + room name + current temperature) with an "{N} di {M} attive"
 * footer and the current mode rendered uppercase in the right slot.
 *
 * D-16 (canonical room-name resolution):
 *   The v1 /homestatus payload does NOT consistently include `room_name` on
 *   each room — useThermostatData's mapper preserves whatever the proxy
 *   returns, but the canonical source for human-readable room names is
 *   `topology.rooms` (from /homesdata). Resolution falls through:
 *     z.name ?? topology?.rooms?.find(r => r.id === z.room_id)?.name ?? z.room_id
 *   The final fallback to `room_id` is non-fatal (tests assert it does not
 *   crash and the raw id renders as a row label).
 *
 * A-05: mode rendered uppercase via .toUpperCase() so any source casing
 *       displays consistently (e.g. "auto" → "AUTO").
 *
 * Bundle source (PRIMARY visual contract):
 *   .planning/inbox/ember-glass-design/project/components/cards.jsx:138-164
 *
 * RC-clean (D-28): no useMemo / useCallback. React Compiler 1.0 auto-memoizes.
 */

import { useState } from 'react';
import { Thermometer } from 'lucide-react';
import { GlassCard } from '../GlassCard';
import { CardHead } from '../CardHead';
import { StatusDot } from '../StatusDot';
import { Sheet } from '../Sheet';
import { SheetPlaceholderBody } from './SheetPlaceholderBody';
import { useThermostatData } from '@/app/components/devices/thermostat/hooks/useThermostatData';
import type { RoomStatus, NetatmoTopology } from '@/app/components/devices/thermostat/hooks/useThermostatData';

const TONE = '#5eafff';

/**
 * D-16: canonical room-name resolution.
 * Inlined as a pure helper (no useCallback per D-28).
 * Fall-through order: explicit name → topology lookup → raw room_id (last-resort).
 */
function resolveRoomName(z: RoomStatus, topology: NetatmoTopology | null): string {
  // RoomStatus is open (`[key: string]: unknown`) — pull `name` defensively.
  const explicit = (z as { name?: string }).name;
  if (typeof explicit === 'string' && explicit.length > 0) return explicit;
  const topoMatch = topology?.rooms?.find((r) => r.id === z.room_id)?.name;
  if (typeof topoMatch === 'string' && topoMatch.length > 0) return topoMatch;
  return z.room_id;
}

export default function ClimateCard() {
  const [open, setOpen] = useState(false);
  const { status, topology } = useThermostatData();

  const allRooms: RoomStatus[] = status?.rooms ?? [];
  const zones = allRooms.slice(0, 4);
  const activeCount = allRooms.filter((r) => r.heating).length;
  const totalCount = allRooms.length;
  const mode = (status?.mode ?? '').toUpperCase();

  const right = (
    <div
      style={{
        fontSize: 11,
        fontWeight: 600,
        color: 'var(--text-2)',
        letterSpacing: 0.3,
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {mode}
    </div>
  );

  return (
    <>
      <GlassCard tone={TONE} onOpen={() => setOpen(true)} data-testid="climate-card">
        <CardHead Icon={Thermometer} label="Clima" tone={TONE} right={right} />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 5,
            flex: 1,
            justifyContent: 'center',
          }}
        >
          {zones.map((z) => (
            <div
              key={z.room_id}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <StatusDot on={Boolean(z.heating)} color={TONE} />
              <div style={{ flex: 1, fontSize: 11, fontWeight: 500, color: '#fff' }}>
                {resolveRoomName(z, topology)}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--text-2)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {(z.temperature ?? 0).toFixed(1)}°
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-2)' }}>
          {activeCount} di {totalCount} attive
        </div>
      </GlassCard>
      <Sheet open={open} onClose={() => setOpen(false)} title="Clima">
        <SheetPlaceholderBody phase="178" device="thermostat" />
      </Sheet>
    </>
  );
}
