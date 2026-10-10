'use client';
/**
 * SonosBody — track line, volume and transport of a Sonos zone.
 *
 * `device.extra.id` is the group id of the zone the speaker plays in; volume and transport act on
 * the whole zone. The volume is sent 250 ms after the last tap. Every control shows its command
 * in progress and the others are locked meanwhile (ROADMAP M81).
 */
import { Pause, Play, SkipBack, SkipForward, Volume2 } from 'lucide-react';
import { useSonosFullData } from '@/app/components/devices/sonos/hooks/useSonosFullData';
import { useSonosCommands } from '@/app/components/devices/sonos/hooks/useSonosCommands';
import { usePendingActions } from '../../usePendingActions';
import { useSyncedSetting } from '../useSyncedSetting';
import { SliderRow } from '../primitives/SliderRow';
import { ControlRow } from '../primitives/ControlRow';
import { MiniButton } from '../primitives/MiniButton';
import type { RoomDevice } from '../types';

export interface SonosBodyProps {
  device: RoomDevice;
  onError?: (message: string | null) => void;
}

export function SonosBody({ device, onError }: SonosBodyProps) {
  const data = useSonosFullData();
  const cmds = useSonosCommands({
    fetchData: data.fetchData,
    applyMutation: data.applyMutation,
    setError: (message) => onError?.(message),
  });
  const actions = usePendingActions();

  // device.extra.id is the group_id for Sonos (== coordinator_uid per AggregatorState.sonos)
  const groupId = String(device.extra.id ?? '');
  const initialVolume = (device.extra.volume as number | undefined) ?? 0;
  const track = (device.extra.track as string | undefined) ?? '';
  const artist = (device.extra.artist as string | undefined) ?? '';

  const showArtist = artist.length > 0 && artist !== '—';

  const [pending, setPending] = useSyncedSetting({
    serverValue: initialVolume,
    delayMs: 250,
    enabled: groupId !== '',
    busy: actions.anyPending,
    send: (value) => void actions.run('volume', () => cmds.handleSetZoneVolume(groupId, value)),
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {(track || showArtist) ? (
        <div
          style={{
            fontSize: 12,
            color: 'var(--text-2)',
            padding: '6px 10px',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: 10,
            marginBottom: 4,
            lineHeight: 1.4,
          }}
        >
          <span style={{ color: '#fff', fontWeight: 500 }}>{track}</span>
          {showArtist ? <span> · {artist}</span> : null}
        </div>
      ) : null}
      <SliderRow
        label="Volume"
        value={pending}
        unit="%"
        Icon={Volume2}
        tone={device.tone}
        pending={actions.isPending('volume')}
        onChange={(next) => { setPending(next); }}
      />
      <ControlRow>
        <MiniButton
          Icon={SkipBack}
          ariaLabel="Brano precedente"
          pending={actions.isPending('previous')}
          disabled={actions.anyPending && !actions.isPending('previous')}
          onClick={() => {
            if (!groupId) return;
            void actions.run('previous', () => cmds.handlePrevious(groupId));
          }}
        />
        <MiniButton
          Icon={device.on ? Pause : Play}
          filled={device.on}
          tone={device.tone}
          ariaLabel={device.on ? 'Pausa' : 'Riproduci'}
          pending={actions.isPending('transport')}
          disabled={actions.anyPending && !actions.isPending('transport')}
          onClick={() => {
            if (!groupId) return;
            void actions.run('transport', () => (device.on ? cmds.handlePause(groupId) : cmds.handlePlay(groupId)));
          }}
        />
        <MiniButton
          Icon={SkipForward}
          ariaLabel="Brano successivo"
          pending={actions.isPending('next')}
          disabled={actions.anyPending && !actions.isPending('next')}
          onClick={() => {
            if (!groupId) return;
            void actions.run('next', () => cmds.handleNext(groupId));
          }}
        />
      </ControlRow>
    </div>
  );
}
