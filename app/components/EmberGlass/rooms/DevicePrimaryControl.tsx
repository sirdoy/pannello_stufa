'use client';
/**
 * DevicePrimaryControl — right side of a DeviceCard header.
 *
 *   - light / plug → InlineToggle on the single device
 *   - sonos        → round play / pause button
 *   - anything else has no one-tap command: nothing is rendered
 *
 * Every control shows the command in progress and ignores a second tap until it settles
 * (ROADMAP M81, rule "Comando in corso"). Each sub-component fetches its own commands hook.
 *
 * RC-clean: no manual memo hooks.
 */

import { Pause, Play } from 'lucide-react';
import Spinner from '@/app/components/ui/Spinner';
import { InlineToggle } from '../InlineToggle';
import { usePendingActions } from '../usePendingActions';
import { useSonosFullData } from '@/app/components/devices/sonos/hooks/useSonosFullData';
import { useSonosCommands } from '@/app/components/devices/sonos/hooks/useSonosCommands';
import { useTuyaCommands } from '@/app/components/devices/tuya/hooks/useTuyaCommands';
import { useRoomLightCommands } from './useRoomLightCommands';
import type { RoomDevice } from './types';

export interface DevicePrimaryControlProps {
  device: RoomDevice;
  /** Reports a refused command to the card, which shows it (null clears it) */
  onError?: (message: string | null) => void;
}

export function DevicePrimaryControl({ device, onError }: DevicePrimaryControlProps) {
  if (device.unreachable) return null;
  switch (device.kind) {
    case 'sonos': return <SonosControl device={device} onError={onError} />;
    case 'light': return <LightToggle device={device} onError={onError} />;
    case 'plug':  return <PlugToggle device={device} onError={onError} />;
    default:      return null;
  }
}

function SonosControl({ device, onError }: DevicePrimaryControlProps) {
  const sonosData = useSonosFullData();
  const cmds = useSonosCommands({
    fetchData: sonosData.fetchData,
    applyMutation: sonosData.applyMutation,
    setError: (message) => onError?.(message),
  });
  const actions = usePendingActions();
  const groupId = String(device.extra['id'] ?? '');
  const playing = device.on;
  const pending = actions.isPending('transport');
  return (
    <button
      type="button"
      aria-label={playing ? 'Pausa' : 'Riproduci'}
      aria-busy={pending || undefined}
      aria-disabled={pending || undefined}
      onClick={() => {
        if (!groupId) return;
        onError?.(null);
        void actions.run('transport', () => (playing ? cmds.handlePause(groupId) : cmds.handlePlay(groupId)));
      }}
      style={{
        width: 40,
        height: 40,
        borderRadius: 99,
        background: playing ? '#fff' : 'rgba(255,255,255,0.08)', // AUDIT-EXCEPTION (rooms.jsx:325)
        color: playing ? '#1a0f08' : '#fff', // AUDIT-EXCEPTION (rooms.jsx:326)
        border: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: pending ? 'default' : 'pointer',
      }}
    >
      {pending ? (
        <Spinner size="sm" variant="current" aria-hidden data-testid="sonos-control-spinner" />
      ) : playing ? (
        <Pause size={16} />
      ) : (
        <Play size={16} />
      )}
    </button>
  );
}

function LightToggle({ device, onError }: DevicePrimaryControlProps) {
  const cmds = useRoomLightCommands(onError);
  const actions = usePendingActions();
  const lightId = String(device.extra['lightId'] ?? '');
  return (
    <InlineToggle
      on={device.on}
      color={device.tone}
      pending={actions.isPending('toggle')}
      aria-label={`${device.on ? 'Spegni' : 'Accendi'} ${device.name}`}
      onChange={(e) => {
        e.stopPropagation();
        if (!lightId) return;
        void actions.run('toggle', () => cmds.handleLightToggle(lightId, !device.on));
      }}
    />
  );
}

function PlugToggle({ device, onError }: DevicePrimaryControlProps) {
  const cmds = useTuyaCommands();
  const actions = usePendingActions();
  const id = String(device.extra['id'] ?? '');
  return (
    <InlineToggle
      on={device.on}
      color={device.tone}
      pending={actions.isPending('toggle')}
      aria-label={`${device.on ? 'Spegni' : 'Accendi'} ${device.name}`}
      onChange={(e) => {
        e.stopPropagation();
        if (!id) return;
        onError?.(null);
        void actions.run('toggle', async () => {
          const done = await cmds.togglePlug(id, device.on);
          if (!done) onError?.('La presa non ha confermato il comando');
        });
      }}
    />
  );
}
