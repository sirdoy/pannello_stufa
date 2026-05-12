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
import { ClimateSheet } from '../sheets/ClimateSheet';
import { useThermostatData } from '@/app/components/devices/thermostat/hooks/useThermostatData';
import { useThermostatCommands } from '@/app/components/devices/thermostat/hooks/useThermostatCommands';
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

/**
 * "Active" signal: room currently controls/calls the boiler.
 *   - heating_power_request > 0  → actively firing (strongest signal)
 *   - room hosts central thermostat hardware (NATherm1 or NAPlug relay)
 *     → "primary controller" room. NRV-only rooms are zone valves and stay
 *     inactive unless they're actively heating.
 *
 * Note: HTTP /homestatus strips therm_setpoint_mode, so we cannot use mode
 * here. WS-only data would expose mode but the rule above is more robust.
 */
function isRoomActive(r: RoomStatus, topology: NetatmoTopology | null): boolean {
  if (r.heating) return true;
  const mods = (topology?.modules ?? []) as Array<{ room_id?: string; type?: string }>;
  return mods.some(
    (m) => m.room_id === r.room_id && (m.type === 'NATherm1' || m.type === 'NAPlug'),
  );
}

export default function ClimateCard() {
  const [open, setOpen] = useState(false);
  // Hooks lifted from ClimateSheet body to this card (260506-d45 Fix B): the
  // sheet was previously calling useThermostatData/useThermostatCommands too,
  // doubling the WS subscription + adaptive-polling cost on every open.
  const data = useThermostatData();
  const cmds = useThermostatCommands({
    homeId: data.topology?.home_id ?? '',
    refetch: data.refetch,
  });
  const { status, topology } = data;

  const allRooms: RoomStatus[] = status?.rooms ?? [];
  // Pin "Ovunque" (central thermostat) first; preserve order for the rest.
  const sortedRooms = [...allRooms].sort((a, b) => {
    const aOvunque = resolveRoomName(a, topology) === 'Ovunque' ? 0 : 1;
    const bOvunque = resolveRoomName(b, topology) === 'Ovunque' ? 0 : 1;
    return aOvunque - bOvunque;
  });
  const zones = sortedRooms.slice(0, 4);
  const activeCount = allRooms.filter((r) => isRoomActive(r, topology)).length;
  const totalCount = allRooms.length;
  const mode = (status?.mode ?? '').toUpperCase();
  // Heat tone for active dots — ember/red instead of card TONE blue
  const HEAT_TONE = '#ff6676';

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
        <CardHead Icon={Thermometer} label="Temperature" tone={TONE} right={right} />
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
              <StatusDot on={isRoomActive(z, topology)} color={HEAT_TONE} />
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
      <Sheet open={open} onClose={() => setOpen(false)} title="Temperature">
        <ClimateSheet data={data} cmds={cmds} />
      </Sheet>
    </>
  );
}
