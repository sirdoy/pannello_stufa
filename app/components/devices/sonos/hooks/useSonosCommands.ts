'use client';

import { useRetryableCommand } from '@/lib/hooks/useRetryableCommand';
import type { SonosCommandOkResponse, SetVolumeRequest, SetMuteRequest, SonosPlayMode, SetPlayModeRequest, SetSleepTimerRequest } from '@/types/sonosProxy';

export interface UseSonosCommandsParams {
  fetchData: () => Promise<void>;
  setError: (e: string | null) => void;
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
  sonosTransportCmd: ReturnType<typeof useRetryableCommand>;
  sonosVolumeCmd: ReturnType<typeof useRetryableCommand>;
  sonosExtendedCmd: ReturnType<typeof useRetryableCommand>;
}

export function useSonosCommands(params: UseSonosCommandsParams): UseSonosCommandsReturn {
  // Three useRetryableCommand hooks at top level (React hooks rules)
  const sonosTransportCmd = useRetryableCommand({ device: 'sonos', action: 'transport' });
  const sonosVolumeCmd = useRetryableCommand({ device: 'sonos', action: 'volume' });
  const sonosExtendedCmd = useRetryableCommand({ device: 'sonos', action: 'extended' });

  const handlePlay = async (groupId: string) => {
    try {
      params.setError(null);
      const response = await sonosTransportCmd.execute(`/api/sonos/zones/${groupId}/play`, { method: 'POST' });
      if (response) {
        if (!response.ok) throw new Error(`Comando fallito: ${response.status}`);
        const data = await response.json() as SonosCommandOkResponse & { suggested_poll_delay_s: number };
        await new Promise<void>(resolve => setTimeout(resolve, (data.suggested_poll_delay_s ?? 1) * 1000));
        await params.fetchData();
      }
    } catch (err: unknown) {
      params.setError(err instanceof Error ? err.message : String(err));
    }
  };

  const handlePause = async (groupId: string) => {
    try {
      params.setError(null);
      const response = await sonosTransportCmd.execute(`/api/sonos/zones/${groupId}/pause`, { method: 'POST' });
      if (response) {
        if (!response.ok) throw new Error(`Comando fallito: ${response.status}`);
        const data = await response.json() as SonosCommandOkResponse & { suggested_poll_delay_s: number };
        await new Promise<void>(resolve => setTimeout(resolve, (data.suggested_poll_delay_s ?? 1) * 1000));
        await params.fetchData();
      }
    } catch (err: unknown) {
      params.setError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleStop = async (groupId: string) => {
    try {
      params.setError(null);
      const response = await sonosTransportCmd.execute(`/api/sonos/zones/${groupId}/stop`, { method: 'POST' });
      if (response) {
        if (!response.ok) throw new Error(`Comando fallito: ${response.status}`);
        const data = await response.json() as SonosCommandOkResponse & { suggested_poll_delay_s: number };
        await new Promise<void>(resolve => setTimeout(resolve, (data.suggested_poll_delay_s ?? 1) * 1000));
        await params.fetchData();
      }
    } catch (err: unknown) {
      params.setError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleNext = async (groupId: string) => {
    try {
      params.setError(null);
      const response = await sonosTransportCmd.execute(`/api/sonos/zones/${groupId}/next`, { method: 'POST' });
      if (response) {
        if (!response.ok) throw new Error(`Comando fallito: ${response.status}`);
        const data = await response.json() as SonosCommandOkResponse & { suggested_poll_delay_s: number };
        await new Promise<void>(resolve => setTimeout(resolve, (data.suggested_poll_delay_s ?? 1) * 1000));
        await params.fetchData();
      }
    } catch (err: unknown) {
      params.setError(err instanceof Error ? err.message : String(err));
    }
  };

  const handlePrevious = async (groupId: string) => {
    try {
      params.setError(null);
      const response = await sonosTransportCmd.execute(`/api/sonos/zones/${groupId}/previous`, { method: 'POST' });
      if (response) {
        if (!response.ok) throw new Error(`Comando fallito: ${response.status}`);
        const data = await response.json() as SonosCommandOkResponse & { suggested_poll_delay_s: number };
        await new Promise<void>(resolve => setTimeout(resolve, (data.suggested_poll_delay_s ?? 1) * 1000));
        await params.fetchData();
      }
    } catch (err: unknown) {
      params.setError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleSetVolume = async (uid: string, volume: number) => {
    try {
      params.setError(null);
      const response = await sonosVolumeCmd.execute(`/api/sonos/speakers/${uid}/volume`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ volume } satisfies SetVolumeRequest),
      });
      if (response) {
        if (!response.ok) throw new Error(`Comando fallito: ${response.status}`);
        const data = await response.json() as SonosCommandOkResponse & { suggested_poll_delay_s: number };
        await new Promise<void>(resolve => setTimeout(resolve, (data.suggested_poll_delay_s ?? 1) * 1000));
        await params.fetchData();
      }
    } catch (err: unknown) {
      params.setError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleSetMute = async (uid: string, mute: boolean) => {
    try {
      params.setError(null);
      const response = await sonosVolumeCmd.execute(`/api/sonos/speakers/${uid}/mute`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mute } satisfies SetMuteRequest),
      });
      if (response) {
        if (!response.ok) throw new Error(`Comando fallito: ${response.status}`);
        const data = await response.json() as SonosCommandOkResponse & { suggested_poll_delay_s: number };
        await new Promise<void>(resolve => setTimeout(resolve, (data.suggested_poll_delay_s ?? 1) * 1000));
        await params.fetchData();
      }
    } catch (err: unknown) {
      params.setError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleSetPlayMode = async (groupId: string, mode: SonosPlayMode) => {
    try {
      params.setError(null);
      const response = await sonosExtendedCmd.execute(`/api/sonos/zones/${groupId}/play-mode`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode } satisfies SetPlayModeRequest),
      });
      if (response) {
        if (!response.ok) throw new Error(`Comando fallito: ${response.status}`);
        const data = await response.json() as SonosCommandOkResponse & { suggested_poll_delay_s: number };
        await new Promise<void>(resolve => setTimeout(resolve, (data.suggested_poll_delay_s ?? 1) * 1000));
        await params.fetchData();
      }
    } catch (err: unknown) {
      params.setError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleSetSleepTimer = async (groupId: string, duration: number) => {
    try {
      params.setError(null);
      const response = await sonosExtendedCmd.execute(`/api/sonos/zones/${groupId}/sleep-timer`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duration } satisfies SetSleepTimerRequest),
      });
      if (response) {
        if (!response.ok) throw new Error(`Comando fallito: ${response.status}`);
        const data = await response.json() as SonosCommandOkResponse & { suggested_poll_delay_s: number };
        await new Promise<void>(resolve => setTimeout(resolve, (data.suggested_poll_delay_s ?? 1) * 1000));
        await params.fetchData();
      }
    } catch (err: unknown) {
      params.setError(err instanceof Error ? err.message : String(err));
    }
  };

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
    sonosTransportCmd,
    sonosVolumeCmd,
    sonosExtendedCmd,
  };
}
