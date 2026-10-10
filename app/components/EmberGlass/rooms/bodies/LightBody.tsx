'use client';
/**
 * LightBody — brightness of a single Hue light.
 *
 * The slider sends one command 250 ms after the last tap, shows it in progress and ignores taps
 * until it settles (ROADMAP M81). The light is addressed by its own id, not by its Hue room: the
 * rooms of this tab are the ones of the Pi (ROADMAP M84).
 */

import { usePendingActions } from '../../usePendingActions';
import { useRoomLightCommands } from '../useRoomLightCommands';
import { useSyncedSetting } from '../useSyncedSetting';
import { SliderRow } from '../primitives/SliderRow';
import type { RoomDevice } from '../types';

export interface LightBodyProps {
  device: RoomDevice;
  onError?: (message: string | null) => void;
}

export function LightBody({ device, onError }: LightBodyProps) {
  const cmds = useRoomLightCommands(onError);
  const actions = usePendingActions();

  const initialBrightness = (device.extra.brightness as number | undefined) ?? 0;
  const lightId = String(device.extra.lightId ?? '');

  const [pending, setPending] = useSyncedSetting({
    serverValue: initialBrightness,
    delayMs: 250,
    enabled: lightId !== '' && device.on,
    busy: actions.anyPending,
    send: (value) => void actions.run('brightness', () => cmds.handleLightBrightnessChange(lightId, value)),
  });

  return (
    <SliderRow
      label="Luminosità"
      value={pending}
      unit="%"
      tone={device.tone}
      disabled={!device.on}
      pending={actions.isPending('brightness')}
      onChange={(next) => setPending(next)}
    />
  );
}
