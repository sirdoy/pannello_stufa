/**
 * useThermostatCommands Hook (CONTEXT D-16)
 *
 * Wraps two existing Netatmo proxy routes via the Phase 7.0 retry/idempotency
 * infrastructure. Mirrors the convention of `useStoveCommands` /
 * `useLightsCommands` / `useSonosCommands`:
 *
 *   POST /api/v1/netatmo/setroomthermpoint  → per-room setpoint + mode
 *   POST /api/v1/netatmo/setthermmode       → home-level mode (schedule|away|hg)
 *
 * Pitfall 5 (RESEARCH §): `setthermmode` does NOT accept 'manual'. The "Manuale"
 * pill in ClimateSheet (Plan 178-05) is a UI affordance reflecting per-room
 * override state — NOT a setHomeMode call. The TypeScript union below statically
 * blocks 'manual' from reaching this surface.
 *
 * Zero useMemo / useCallback (Phase 11.1 hygiene — referential stability not
 * needed for this consumer surface).
 */

'use client';

import { useRetryableCommand } from '@/lib/hooks/useRetryableCommand';
import { NETATMO_ROUTES } from '@/lib/routes';
import type {
  SetRoomThermpointRequest,
  SetThermmodeRequest,
} from '@/types/netatmoProxy';

/**
 * Parameters required by useThermostatCommands.
 */
export interface UseThermostatCommandsParams {
  /** Home id from useThermostatData().topology.home_id. Required for both writes. */
  homeId: string;
  /** Refetch trigger — called after a successful write to refresh local state. */
  refetch: () => Promise<void>;
  /** Optional setError to surface failures to the consuming UI. */
  setError?: (message: string | null) => void;
}

/**
 * Command handlers and retryable command objects.
 */
export interface UseThermostatCommandsReturn {
  /** Per-room manual setpoint write — POSTs {home_id, room_id, mode: 'manual', temp}. */
  setRoomSetpoint: (roomId: string, target: number) => Promise<void>;
  /** Home-level mode write — POSTs {home_id, mode}. Union excludes 'manual' (Pitfall 5). */
  setHomeMode: (mode: SetThermmodeRequest['mode']) => Promise<void>;
  /** Per-room mode write — POSTs {home_id, room_id, mode}. Used to revert from override. */
  setRoomMode: (
    roomId: string,
    mode: SetRoomThermpointRequest['mode'],
  ) => Promise<void>;
  /** Underlying retryable command for setRoomSetpoint / setRoomMode (UI integration). */
  netatmoTempCmd: ReturnType<typeof useRetryableCommand>;
  /** Underlying retryable command for setHomeMode (UI integration). */
  netatmoModeCmd: ReturnType<typeof useRetryableCommand>;
}

/**
 * Custom hook for Netatmo write commands.
 *
 * @param params - Configuration parameters (homeId, refetch, optional setError)
 * @returns Command handlers + underlying retryable command objects
 */
export function useThermostatCommands(
  params: UseThermostatCommandsParams,
): UseThermostatCommandsReturn {
  // Two retry handles — one per logical command grouping. Order matters: temp
  // cmd is registered first so the test harness can map call order → handle.
  const netatmoTempCmd = useRetryableCommand({
    device: 'netatmo',
    action: 'setRoomSetpoint',
  });
  const netatmoModeCmd = useRetryableCommand({
    device: 'netatmo',
    action: 'setHomeMode',
  });

  /**
   * Per-room manual setpoint write.
   * Body: { home_id, room_id, mode: 'manual', temp }
   */
  const setRoomSetpoint = async (roomId: string, target: number): Promise<void> => {
    try {
      const body: SetRoomThermpointRequest = {
        home_id: params.homeId,
        room_id: roomId,
        mode: 'manual',
        temp: target,
      };
      const res = await netatmoTempCmd.execute(NETATMO_ROUTES.setRoomThermpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res?.ok) await params.refetch();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      params.setError?.(message);
    }
  };

  /**
   * Home-level mode write.
   * Body: { home_id, mode }  where mode ∈ 'schedule' | 'away' | 'hg' (NOT 'manual').
   */
  const setHomeMode = async (mode: SetThermmodeRequest['mode']): Promise<void> => {
    try {
      const body: SetThermmodeRequest = { home_id: params.homeId, mode };
      const res = await netatmoModeCmd.execute(NETATMO_ROUTES.setThermMode, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res?.ok) await params.refetch();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      params.setError?.(message);
    }
  };

  /**
   * Per-room mode write (no temp).
   * Currently used to revert from 'manual' (override) → 'home' (follow schedule).
   * For "off" the standard Netatmo dance is setHomeMode('hg') (frost-guard).
   */
  const setRoomMode = async (
    roomId: string,
    mode: SetRoomThermpointRequest['mode'],
  ): Promise<void> => {
    try {
      const body: SetRoomThermpointRequest = {
        home_id: params.homeId,
        room_id: roomId,
        mode,
      };
      const res = await netatmoTempCmd.execute(NETATMO_ROUTES.setRoomThermpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res?.ok) await params.refetch();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      params.setError?.(message);
    }
  };

  return {
    setRoomSetpoint,
    setHomeMode,
    setRoomMode,
    netatmoTempCmd,
    netatmoModeCmd,
  };
}
