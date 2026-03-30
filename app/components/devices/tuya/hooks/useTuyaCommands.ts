'use client';

import type { TuyaPlugMutation } from '@/types/tuyaProxy';

export interface UseTuyaCommandsReturn {
  togglePlug: (deviceId: string, currentState: boolean) => Promise<TuyaPlugMutation | null>;
  setTimer: (deviceId: string, seconds: number) => Promise<TuyaPlugMutation | null>;
  cancelTimer: (deviceId: string) => Promise<TuyaPlugMutation | null>;
}

export function useTuyaCommands(): UseTuyaCommandsReturn {
  const togglePlug = async (deviceId: string, currentState: boolean): Promise<TuyaPlugMutation | null> => {
    try {
      const res = await fetch(`/api/tuya/plugs/${deviceId}/state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ on: !currentState }),
      });

      if (!res.ok) return null;

      const mutation = await res.json() as TuyaPlugMutation;
      return mutation.data_confirmed ? mutation : null;
    } catch {
      return null;
    }
  };

  const setTimer = async (deviceId: string, seconds: number): Promise<TuyaPlugMutation | null> => {
    try {
      const res = await fetch(`/api/tuya/plugs/${deviceId}/timer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seconds }),
      });

      if (!res.ok) return null;

      const mutation = await res.json() as TuyaPlugMutation;
      return mutation.data_confirmed ? mutation : null;
    } catch {
      return null;
    }
  };

  const cancelTimer = async (deviceId: string): Promise<TuyaPlugMutation | null> => {
    return setTimer(deviceId, 0);
  };

  return { togglePlug, setTimer, cancelTimer };
}
