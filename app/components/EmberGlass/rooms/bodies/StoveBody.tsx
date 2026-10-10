'use client';
/**
 * StoveBody — power and fan readings of the stove, with −, on / off and + (one power step per tap).
 *
 * Every button shows its command in progress and the others are locked until it settles
 * (ROADMAP M81); a refused command is reported to the card (rule M77: never `void handler()`
 * without a catch). Ignition stays blocked while cleaning is required. When the stove does not
 * answer only "Spegni" is left (rule M78).
 */

import { useRouter } from 'next/navigation';
import { Minus, Plus, Power } from 'lucide-react';
import { useUser } from '@/lib/auth/useUser';
import { useStoveData } from '@/app/components/devices/stove/hooks/useStoveData';
import { useStoveCommands } from '@/app/components/devices/stove/hooks/useStoveCommands';
import { usePendingActions } from '../../usePendingActions';
import { StatChip } from '../primitives/StatChip';
import { ControlRow } from '../primitives/ControlRow';
import { MiniButton } from '../primitives/MiniButton';
import type { RoomDevice } from '../types';

export interface StoveBodyProps {
  device: RoomDevice;
  onError?: (message: string | null) => void;
}

export function StoveBody({ device, onError }: StoveBodyProps) {
  const router = useRouter();
  const { user } = useUser();
  const stoveData = useStoveData({ userId: user?.sub });

  const cmds = useStoveCommands({
    stoveData: {
      setLoading: stoveData.setLoading,
      setLoadingMessage: stoveData.setLoadingMessage,
      fetchStatusAndUpdate: stoveData.fetchStatusAndUpdate,
      setSchedulerEnabled: stoveData.setSchedulerEnabled,
      setSemiManualMode: stoveData.setSemiManualMode,
      setReturnToAutoAt: stoveData.setReturnToAutoAt,
      setNextScheduledAction: stoveData.setNextScheduledAction,
      setCleaningInProgress: stoveData.setCleaningInProgress,
      fetchMaintenanceStatus: stoveData.fetchMaintenanceStatus,
      semiManualMode: stoveData.semiManualMode,
    },
    router,
    user,
  });

  const actions = usePendingActions();
  const powerLevel = stoveData.powerLevel;
  const fanLevel = stoveData.fanLevel;
  const needsCleaning = stoveData.needsMaintenance;

  const send = (key: string, command: () => Promise<void>) => {
    onError?.(null);
    void actions.run(key, async () => {
      try {
        await command();
      } catch (err) {
        onError?.(err instanceof Error ? err.message : 'Comando non riuscito');
      }
    });
  };
  const lockedFor = (key: string) => actions.anyPending && !actions.isPending(key);
  const setPower = (key: string, next: number) =>
    send(key, () => cmds.handlePowerChange({ target: { value: String(next) } }));

  // No reading: no levels to show, only the safe command (rule M78)
  if (device.unreachable) {
    return (
      <ControlRow>
        <MiniButton
          Icon={Power}
          label="Spegni"
          pending={actions.isPending('power')}
          onClick={() => send('power', () => cmds.handleShutdown())}
        />
      </ControlRow>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
        <StatChip label="Potenza" value={powerLevel === null ? '—' : `${powerLevel}/5`} tone={device.tone} />
        <StatChip label="Ventola" value={fanLevel === null ? '—' : `${fanLevel}/6`} tone={device.tone} />
      </div>
      <ControlRow>
        <MiniButton
          Icon={Minus}
          label="Meno"
          pending={actions.isPending('down')}
          disabled={!device.on || powerLevel === null || powerLevel <= 1 || lockedFor('down')}
          onClick={() => setPower('down', Math.max(1, (powerLevel ?? 1) - 1))}
        />
        <MiniButton
          Icon={Power}
          label={device.on ? 'Spegni' : 'Accendi'}
          filled={device.on}
          tone={device.tone}
          pending={actions.isPending('power')}
          disabled={(!device.on && needsCleaning) || lockedFor('power')}
          onClick={() => send('power', () => (device.on ? cmds.handleShutdown() : cmds.handleIgnite()))}
        />
        <MiniButton
          Icon={Plus}
          label="Più"
          pending={actions.isPending('up')}
          disabled={!device.on || powerLevel === null || powerLevel >= 5 || lockedFor('up')}
          onClick={() => setPower('up', Math.min(5, (powerLevel ?? 1) + 1))}
        />
      </ControlRow>
      {needsCleaning && (
        <div
          role="status"
          data-testid="stove-body-maintenance-alert"
          style={{ fontSize: 12, fontWeight: 600, color: '#ffb84a' }}
        >
          Pulizia richiesta: accensione bloccata finché non la confermi
        </div>
      )}
    </div>
  );
}
