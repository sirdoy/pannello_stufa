'use client';

import { useRetryableCommand } from '@/lib/hooks/useRetryableCommand';
import type { SonosCommandOkResponse, SetVolumeRequest, SetMuteRequest, SetSeekRequest, SonosPlayMode, SetPlayModeRequest, SetSleepTimerRequest, SetEqRequest, SetHomeTheaterRequest, SwitchSourceRequest, JoinRequest } from '@/types/sonosProxy';

export interface UseSonosCommandsParams {
  fetchData: () => Promise<void>;
  setError: (e: string | null) => void;
  /**
   * Applies a confirmed mutation response to the local snapshot (see
   * useSonosFullData.applyMutation). When it returns true no refetch is done;
   * when absent or false the hook waits suggested_poll_delay_s and refetches.
   */
  applyMutation?: (body: SonosCommandOkResponse) => boolean;
}

export interface UseSonosCommandsReturn {
  handlePlay: (groupId: string) => Promise<void>;
  handlePause: (groupId: string) => Promise<void>;
  handleStop: (groupId: string) => Promise<void>;
  handleNext: (groupId: string) => Promise<void>;
  handlePrevious: (groupId: string) => Promise<void>;
  handleSetVolume: (uid: string, volume: number) => Promise<void>;
  handleSetMute: (uid: string, mute: boolean) => Promise<void>;
  handleSetPlayMode: (groupId: string, mode: SonosPlayMode) => Promise<void>;
  handleSetSleepTimer: (groupId: string, duration: number) => Promise<void>;
  handleSetEq: (uid: string, eq: SetEqRequest) => Promise<void>;
  handleSetHomeTheater: (uid: string, settings: SetHomeTheaterRequest) => Promise<void>;
  handleSwitchSource: (uid: string, source: 'tv' | 'line_in') => Promise<void>;
  handleJoinGroup: (uid: string, targetUid: string) => Promise<void>;
  handleUnjoinGroup: (uid: string) => Promise<void>;
  handleSetZoneVolume: (groupId: string, volume: number) => Promise<void>;
  handleSeek: (groupId: string, position: string) => Promise<void>;
  sonosTransportCmd: ReturnType<typeof useRetryableCommand>;
  sonosVolumeCmd: ReturnType<typeof useRetryableCommand>;
  sonosExtendedCmd: ReturnType<typeof useRetryableCommand>;
}

export function useSonosCommands(params: UseSonosCommandsParams): UseSonosCommandsReturn {
  // Three useRetryableCommand hooks at top level (React hooks rules)
  const sonosTransportCmd = useRetryableCommand({ device: 'sonos', action: 'transport' });
  const sonosVolumeCmd = useRetryableCommand({ device: 'sonos', action: 'volume' });
  const sonosExtendedCmd = useRetryableCommand({ device: 'sonos', action: 'extended' });

  type Cmd = ReturnType<typeof useRetryableCommand>;

  /**
   * Sends a command and reconciles local state. The backend re-reads the
   * affected resource after the command and returns it (data_confirmed), so a
   * confirmed body is applied directly; the full refetch (~20 requests) runs
   * only when the state is unconfirmed or cannot be applied.
   */
  const run = async (cmd: Cmd, url: string, method: 'POST' | 'PUT', payload?: object) => {
    try {
      params.setError(null);
      const response = await cmd.execute(url, payload === undefined
        ? { method }
        : { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!response) return; // deduplicated
      if (!response.ok) throw new Error(`Comando fallito: ${response.status}`);
      const data = await response.json() as SonosCommandOkResponse & { suggested_poll_delay_s?: number };
      if (data.data_confirmed && params.applyMutation?.(data)) return;
      await new Promise<void>(resolve => setTimeout(resolve, (data.suggested_poll_delay_s ?? 1) * 1000));
      await params.fetchData();
    } catch (err: unknown) {
      params.setError(err instanceof Error ? err.message : String(err));
    }
  };

  const zone = (groupId: string) => `/api/v1/sonos/zones/${groupId}`;
  const speaker = (uid: string) => `/api/v1/sonos/speakers/${uid}`;

  const handlePlay = (groupId: string) => run(sonosTransportCmd, `${zone(groupId)}/play`, 'POST');
  const handlePause = (groupId: string) => run(sonosTransportCmd, `${zone(groupId)}/pause`, 'POST');
  const handleStop = (groupId: string) => run(sonosTransportCmd, `${zone(groupId)}/stop`, 'POST');
  const handleNext = (groupId: string) => run(sonosTransportCmd, `${zone(groupId)}/next`, 'POST');
  const handlePrevious = (groupId: string) => run(sonosTransportCmd, `${zone(groupId)}/previous`, 'POST');

  const handleSetVolume = (uid: string, volume: number) =>
    run(sonosVolumeCmd, `${speaker(uid)}/volume`, 'PUT', { volume } satisfies SetVolumeRequest);
  const handleSetMute = (uid: string, mute: boolean) =>
    run(sonosVolumeCmd, `${speaker(uid)}/mute`, 'PUT', { mute } satisfies SetMuteRequest);
  const handleSetZoneVolume = (groupId: string, volume: number) =>
    run(sonosVolumeCmd, `${zone(groupId)}/volume`, 'PUT', { volume } satisfies SetVolumeRequest);
  const handleSeek = (groupId: string, position: string) =>
    run(sonosVolumeCmd, `${zone(groupId)}/seek`, 'PUT', { position } satisfies SetSeekRequest);

  const handleSetPlayMode = (groupId: string, mode: SonosPlayMode) =>
    run(sonosExtendedCmd, `${zone(groupId)}/play-mode`, 'PUT', { mode } satisfies SetPlayModeRequest);
  const handleSetSleepTimer = (groupId: string, duration: number) =>
    run(sonosExtendedCmd, `${zone(groupId)}/sleep-timer`, 'PUT', { duration } satisfies SetSleepTimerRequest);
  const handleSetEq = (uid: string, eq: SetEqRequest) =>
    run(sonosExtendedCmd, `${speaker(uid)}/eq`, 'PUT', eq satisfies SetEqRequest);
  const handleSetHomeTheater = (uid: string, settings: SetHomeTheaterRequest) =>
    run(sonosExtendedCmd, `${speaker(uid)}/home-theater`, 'PUT', settings satisfies SetHomeTheaterRequest);
  const handleSwitchSource = (uid: string, source: 'tv' | 'line_in') =>
    run(sonosExtendedCmd, `${speaker(uid)}/source`, 'POST', { source } satisfies SwitchSourceRequest);
  const handleJoinGroup = (uid: string, targetUid: string) =>
    run(sonosExtendedCmd, `${speaker(uid)}/join`, 'POST', { target_uid: targetUid } satisfies JoinRequest);
  const handleUnjoinGroup = (uid: string) => run(sonosExtendedCmd, `${speaker(uid)}/unjoin`, 'POST');

  return {
    handlePlay,
    handlePause,
    handleStop,
    handleNext,
    handlePrevious,
    handleSetVolume,
    handleSetMute,
    handleSetPlayMode,
    handleSetSleepTimer,
    handleSetEq,
    handleSetHomeTheater,
    handleSwitchSource,
    handleJoinGroup,
    handleUnjoinGroup,
    handleSetZoneVolume,
    handleSeek,
    sonosTransportCmd,
    sonosVolumeCmd,
    sonosExtendedCmd,
  };
}
