'use client';
/**
 * RoomsTab — Phase 179 (Plan 179-08 / ROOMS-01 / CONTEXT D-41..D-44)
 *
 * Top-level orchestrator for the /stanze route.
 * - Calls 5 device-data hooks + useUser + useVersion
 * - Builds AggregatorState literal per RESEARCH §Aggregator Reconciliation (Pitfalls 1-9)
 * - Owns selectedRoomName state; renders 6 RoomCards + 1 shared RoomSheet
 * - <RoomSheet key={selectedRoomName ?? 'closed'}> remounts on room change (RESEARCH §Pattern 4)
 *
 * RC-clean: no manual memo hooks (D-66/D-67). React Compiler 1.0 auto-memoizes.
 * Italian copy frozen: D-48 "Stanze" 30px display, "{N} stanze" 13px dim caps.
 */

import { useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useVersion } from '@/app/context/VersionContext';
import { useStoveData } from '@/app/components/devices/stove/hooks/useStoveData';
import { useThermostatData } from '@/app/components/devices/thermostat/hooks/useThermostatData';
import { useLightsData } from '@/app/components/devices/lights/hooks/useLightsData';
import { useTuyaData } from '@/app/components/devices/tuya/hooks/useTuyaData';
import { useSonosFullData } from '@/app/components/devices/sonos/hooks/useSonosFullData';
import { ROOMS } from './lib/rooms-config';
import { getDevicesForRoom } from './lib/getDevicesForRoom';
import { RoomCard } from './RoomCard';
import { RoomSheet } from './RoomSheet';
import type { AggregatorState } from './types';

export function RoomsTab(): JSX.Element {
  const [selectedRoomName, setSelectedRoomName] = useState<string | null>(null);

  // Pitfall 9: useStoveData requires { checkVersion, userId }
  const { checkVersion } = useVersion();
  const { user } = useUser();
  const stove = useStoveData({ checkVersion, userId: user?.sub });

  const thermostat = useThermostatData();
  const lights = useLightsData();
  const tuya = useTuyaData();
  const sonos = useSonosFullData();

  // Build AggregatorState literal per RESEARCH §Aggregator Reconciliation
  const state: AggregatorState = {
    stove: {
      on: stove.isAccesa ?? false,
      temp: 0, // no temp field in useStoveData (Pitfall 1) — aggregator passes 0
      powerLevel: stove.powerLevel ?? 0,
      fanLevel: stove.fanLevel ?? 0,
    },
    thermostat: {
      zones: (thermostat.topology?.rooms ?? []).map((r) => {
        const s = thermostat.status?.rooms?.find(
          (sr) => sr.room_id === r.id
        );
        // Pitfall 2: discriminate NATherm1 → 'thermo', else → 'valve'
        const linked = (thermostat.topology?.modules ?? []).find(
          (m) => (m as Record<string, unknown>)['room_id'] === r.id
        );
        const moduleType = (linked as Record<string, unknown> | undefined)?.['type'];
        return {
          name: r.name ?? '',
          on: s?.mode !== 'hg',
          current: typeof s?.temperature === 'number' ? s.temperature : 0,
          target: typeof s?.setpoint === 'number' ? s.setpoint : 20,
          kind: moduleType === 'NATherm1' ? ('thermo' as const) : ('valve' as const),
          roomId: r.id,
        };
      }),
    },
    lights: {
      // Pitfall 5: brightness 0-254 → percent (round to integer)
      lights: (lights.lights ?? [])
        .filter((l) => l.room_name !== null && l.room_id !== null)
        .map((l) => ({
          name: l.name,
          on: l.on,
          room_name: l.room_name,
          groupId: l.room_id ?? '',
          brightness: Math.round(((l.brightness ?? 0) / 254) * 100),
        })),
    },
    plugs: {
      // Pitfall 4: Tuya field renames (device_id, switch_on, power_w)
      plugs: (tuya.plugs ?? []).map((p) => ({
        id: p.device_id,
        name: p.custom_name ?? p.device_id,
        on: p.switch_on === true,
        power: p.power_w ?? 0,
        today_kwh: p.energy_kwh ?? 0,
      })),
    },
    sonos: {
      // Sonos: coordinator_uid used for volume lookup (Pitfall 7)
      groups: (sonos.data?.zones ?? []).map((z) => ({
        id: z.group_id,
        name: z.label,
        playing:
          sonos.data?.playback?.[z.group_id]?.transport_state === 'PLAYING',
        track: sonos.data?.playback?.[z.group_id]?.title ?? '',
        artist: sonos.data?.playback?.[z.group_id]?.artist ?? '',
        volume: sonos.data?.volumes?.[z.coordinator_uid]?.volume ?? 0,
        coordinator: z.coordinator_uid,
      })),
    },
  };

  // Derived room + devices for the open sheet
  const room =
    ROOMS.find((r) => r.name === selectedRoomName) ?? null;
  const devices = room
    ? getDevicesForRoom(state, room.name)
    : [];

  return (
    <>
      {/* Page chrome — D-43: 70px top safe-area padding + title block */}
      <div style={{ paddingTop: 70 }}>
        {/* Title block — D-48: "{N} stanze" 13px dim caps + "Stanze" 30px display */}
        <div style={{ padding: '0 20px 20px' }}>
          <div
            style={{
              fontSize: 13,
              color: 'var(--text-2)',
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            {ROOMS.length} stanze
          </div>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 30,
              fontWeight: 600,
              color: '#fff',
              letterSpacing: -0.8,
            }}
          >Stanze</div>
        </div>

        {/* 2-col RoomCard grid — D-43: repeat(2,1fr), gap 12, padding 0 12px */}
        <div
          style={{
            padding: '0 12px',
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 12,
          }}
        >
          {ROOMS.map((r) => (
            <RoomCard
              key={r.name}
              room={r}
              devices={getDevicesForRoom(state, r.name)}
              onOpen={() => setSelectedRoomName(r.name)}
            />
          ))}
        </div>
      </div>

      {/* Single shared RoomSheet — D-44 + RESEARCH §Pattern 4: key remounts on room change */}
      <RoomSheet
        key={selectedRoomName ?? 'closed'}
        open={!!selectedRoomName}
        onClose={() => setSelectedRoomName(null)}
        room={room}
        devices={devices}
      />
    </>
  );
}
