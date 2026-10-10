'use client';
/**
 * ThermoBody — thermostat or valve of a Netatmo room: measured and target temperature, ±0.5°,
 * and "Programma" to give the room back to the schedule.
 *
 * The setpoint is sent 500 ms after the last tap; while a command is in progress the button that
 * started it shows a spinner and the others are locked (ROADMAP M81). Commands act on the single
 * room, never on the whole house.
 */

import { useState } from 'react';
import { CalendarClock, Minus, Plus } from 'lucide-react';
import { useThermostatData } from '@/app/components/devices/thermostat/hooks/useThermostatData';
import { useThermostatCommands } from '@/app/components/devices/thermostat/hooks/useThermostatCommands';
import { usePendingActions } from '../../usePendingActions';
import { useSyncedSetting } from '../useSyncedSetting';
import { DualTempReadout } from '../primitives/DualTempReadout';
import { ControlRow } from '../primitives/ControlRow';
import { MiniButton } from '../primitives/MiniButton';
import type { RoomDevice } from '../types';

export interface ThermoBodyProps {
  device: RoomDevice;
  onError?: (message: string | null) => void;
}

const MIN_TEMP = 7;
const MAX_TEMP = 30;

export function ThermoBody({ device, onError }: ThermoBodyProps) {
  const data = useThermostatData();
  const homeId = data.topology?.home_id ?? '';
  const cmds = useThermostatCommands({
    homeId,
    refetch: data.refetch,
    setError: (message) => onError?.(message),
  });
  const actions = usePendingActions();

  const initialTarget = (device.extra.target as number | undefined) ?? 20;
  const current = (device.extra.current as number | undefined) ?? 0;
  const roomId = String(device.extra.roomId ?? '');
  const ready = homeId !== '' && roomId !== '';

  const [lastStep, setLastStep] = useState<'down' | 'up'>('up');
  const [pending, setPending] = useSyncedSetting({
    serverValue: initialTarget,
    delayMs: 500,
    enabled: ready,
    busy: actions.anyPending,
    send: (value) => {
      onError?.(null);
      void actions.run('setpoint', () => cmds.setRoomSetpoint(roomId, value));
    },
  });

  const step = (delta: number) => {
    setLastStep(delta < 0 ? 'down' : 'up');
    setPending((v) => Math.min(MAX_TEMP, Math.max(MIN_TEMP, Math.round((v + delta) * 10) / 10)));
  };

  const sending = actions.isPending('setpoint');
  const locked = !ready || actions.anyPending;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <DualTempReadout current={current} target={pending} tone={device.tone} />
      <ControlRow>
        {/* Unicode minus U+2212 in the label */}
        <MiniButton
          Icon={Minus}
          label="−0.5°"
          pending={sending && lastStep === 'down'}
          disabled={locked && !(sending && lastStep === 'down')}
          onClick={() => step(-0.5)}
        />
        <MiniButton
          Icon={Plus}
          label="+0.5°"
          pending={sending && lastStep === 'up'}
          disabled={locked && !(sending && lastStep === 'up')}
          onClick={() => step(0.5)}
        />
        <MiniButton
          Icon={CalendarClock}
          label="Programma"
          pending={actions.isPending('schedule')}
          disabled={locked && !actions.isPending('schedule')}
          onClick={() => {
            onError?.(null);
            void actions.run('schedule', () => cmds.setRoomMode(roomId, 'home'));
          }}
        />
      </ControlRow>
    </div>
  );
}
