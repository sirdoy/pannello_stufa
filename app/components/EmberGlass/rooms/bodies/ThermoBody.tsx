'use client';
/**
 * ThermoBody / ValveBody — Phase 179 rooms body (Plan 179-06)
 * Bundle source: rooms.jsx:374-387
 * CONTEXT D-28: DualTempReadout + ControlRow with 4 MiniButtons.
 * D-53: Frozen copy — "−0.5°" (U+2212), "+0.5°", "Eco", "Auto".
 * Pitfall 8: gate all command calls on non-empty homeId AND roomId.
 * Pattern 2 (ClimateSheet): useDebounce(pending, 500) → setRoomSetpoint.
 * D-66/D-67: React Compiler auto-memoizes — no manual memo hooks.
 *
 * ThermoBody and ValveBody share the same body shape (both use
 * DualTempReadout + ControlRow). The discriminator (Termostato vs
 * Termovalvola) lives in DeviceCard header, not here.
 */

import { useEffect, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { useThermostatData } from '@/app/components/devices/thermostat/hooks/useThermostatData';
import { useThermostatCommands } from '@/app/components/devices/thermostat/hooks/useThermostatCommands';
import { useDebounce } from '@/app/hooks/useDebounce';
import { DualTempReadout } from '../primitives/DualTempReadout';
import { ControlRow } from '../primitives/ControlRow';
import { MiniButton } from '../primitives/MiniButton';
import type { RoomDevice } from '../types';

/**
 * Shared body for thermo and valve kinds.
 * Self-fetches useThermostatData to get home_id (CONTEXT D-39 self-fetch convention).
 *
 * Threat T-179-06-01: all command calls gated on non-empty homeId AND roomId (Pitfall 8).
 * Threat T-179-06-02: useDebounce(pending, 500) coalesces rapid taps into one network call.
 */
function ThermoOrValveBody({ device }: { device: RoomDevice }){
  const data = useThermostatData();
  const homeId = data.topology?.home_id ?? '';
  const refetch = data.refetch;
  const cmds = useThermostatCommands({ homeId, refetch });

  const initialTarget = (device.extra.target as number | undefined) ?? 20;
  const current = (device.extra.current as number | undefined) ?? 0;
  const roomId = String(device.extra.roomId ?? '');

  const [pending, setPending] = useState<number>(initialTarget);
  // 500ms debounce per CONTEXT D-28 / ClimateSheet:101 / Phase 16.0 setpoint timing.
  const debounced = useDebounce(pending, 500);

  // Fire setRoomSetpoint when debounced value diverges from initial.
  // Gate: homeId and roomId must both be non-empty (Pitfall 8 / T-179-06-01).
  useEffect(() => {
    if (!homeId || !roomId) return;
    if (debounced === initialTarget) return; // skip first-render no-op
    void cmds.setRoomSetpoint(roomId, debounced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <DualTempReadout current={current} target={pending} tone={device.tone} />
      <ControlRow>
        {/* D-53: unicode minus U+2212 (not hyphen) in label */}
        <MiniButton
          Icon={Minus}
          label="−0.5°"
          onClick={() => setPending((v) => Math.round((v - 0.5) * 10) / 10)}
          ariaLabel="−0.5°"
        />
        <MiniButton
          Icon={Plus}
          label="+0.5°"
          onClick={() => setPending((v) => Math.round((v + 0.5) * 10) / 10)}
          ariaLabel="+0.5°"
        />
        {/* Eco → setHomeMode('away'); gated on homeId */}
        <MiniButton
          label="Eco"
          onClick={() => {
            if (homeId) void cmds.setHomeMode('away');
          }}
        />
        {/* Auto → setHomeMode('schedule'); gated on homeId */}
        <MiniButton
          label="Auto"
          onClick={() => {
            if (homeId) void cmds.setHomeMode('schedule');
          }}
        />
      </ControlRow>
    </div>
  );
}

/** Thermostat zone body (kind: 'thermo'). */
export function ThermoBody({ device }: { device: RoomDevice }){
  return <ThermoOrValveBody device={device} />;
}

/** Thermostatic valve body (kind: 'valve'). Same shape as ThermoBody. */
export function ValveBody({ device }: { device: RoomDevice }){
  return <ThermoOrValveBody device={device} />;
}
