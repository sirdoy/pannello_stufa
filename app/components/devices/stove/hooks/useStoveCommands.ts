/**
 * useStoveCommands Hook
 *
 * Encapsulates all stove command handlers with retry infrastructure.
 * MUST call useRetryableCommand at top level (React hooks rules).
 *
 * All commands integrate with Phase 55 retry infrastructure:
 * - Automatic retry with exponential backoff
 * - Request deduplication
 * - Idempotency key injection
 * - Persistent error toasts
 *
 * Commands return 202 Accepted (proxy convention).
 * Callers delay fetchStatusAndUpdate by suggested_poll_delay_s seconds.
 * 409 Conflict indicates the proxy rejected the command due to current state.
 */

'use client';

import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { getNextScheduledAction } from '@/lib/schedulerService';
import { clearSemiManualMode } from '@/lib/schedulerApiClient';
import { STOVE_ROUTES } from '@/lib/routes';
import { logStoveAction, logSchedulerAction } from '@/lib/logService';
import { confirmCleaning } from '@/lib/maintenanceService';
import { useRetryableCommand } from '@/lib/hooks/useRetryableCommand';
import type { UseStoveDataReturn } from './useStoveData';
import type { ThermorossiCommandResponse } from '@/types/thermorossiProxy';

/**
 * Parameters required by useStoveCommands
 */
export interface UseStoveCommandsParams {
  /** State setters and fetch functions from useStoveData */
  stoveData: Pick<
    UseStoveDataReturn,
    | 'setLoading'
    | 'setLoadingMessage'
    | 'fetchStatusAndUpdate'
    | 'setSchedulerEnabled'
    | 'setSemiManualMode'
    | 'setReturnToAutoAt'
    | 'setNextScheduledAction'
    | 'setCleaningInProgress'
    | 'fetchMaintenanceStatus'
    | 'semiManualMode'
  >;
  /** Next.js router for navigation */
  router: AppRouterInstance;
  /** Auth0 user object (for confirmCleaning) */
  user?: any;
}

/**
 * Command handlers and retryable command objects
 */
export interface UseStoveCommandsReturn {
  // Command handlers
  handleIgnite: () => Promise<void>;
  handleShutdown: () => Promise<void>;
  handleFanChange: (e: React.ChangeEvent<HTMLInputElement> | { target: { value: string } }) => Promise<void>;
  handlePowerChange: (e: React.ChangeEvent<HTMLInputElement> | { target: { value: string } }) => Promise<void>;
  handleClearSemiManual: () => Promise<void>;
  handleSetManualMode: () => Promise<void>;
  handleSetAutomaticMode: () => Promise<void>;
  handleConfirmCleaning: () => Promise<void>;
  handleManualRefresh: () => Promise<void>;

  // Retryable command objects (for UI integration)
  igniteCmd: ReturnType<typeof useRetryableCommand>;
  shutdownCmd: ReturnType<typeof useRetryableCommand>;
  setFanCmd: ReturnType<typeof useRetryableCommand>;
  setPowerCmd: ReturnType<typeof useRetryableCommand>;
}

/**
 * Custom hook for stove command execution
 *
 * Integrates with useRetryableCommand for all device commands.
 * Handlers update UI state and log actions.
 *
 * @param params - Configuration parameters
 * @returns Command handlers and retryable command objects
 */
export function useStoveCommands(params: UseStoveCommandsParams): UseStoveCommandsReturn {
  const { stoveData, router, user } = params;

  // Retry infrastructure - one hook per command type (React hooks rules)
  const igniteCmd = useRetryableCommand({ device: 'stove', action: 'ignite' });
  const shutdownCmd = useRetryableCommand({ device: 'stove', action: 'shutdown' });
  const setFanCmd = useRetryableCommand({ device: 'stove', action: 'setFan' });
  const setPowerCmd = useRetryableCommand({ device: 'stove', action: 'setPower' });

  // Command handlers
  const handleIgnite = async () => {
    stoveData.setLoadingMessage('Accensione stufa...');
    stoveData.setLoading(true);
    try {
      const response = await igniteCmd.execute(STOVE_ROUTES.ignite, {
        method: 'POST',
        body: JSON.stringify({ source: 'manual' }),
      });
      if (response) {
        if (!response.ok) {
          if (response.status === 409) throw new Error('Command not allowed in current state');
          throw new Error(`Command failed: ${response.status}`);
        }
        const data = await response.json() as ThermorossiCommandResponse;
        await logStoveAction.ignite();
        const delayMs = (data.suggested_poll_delay_s ?? 15) * 1000;
        await new Promise<void>(resolve => setTimeout(resolve, delayMs));
        await stoveData.fetchStatusAndUpdate();
      }
      // If response is null, request was deduplicated (silently blocked)
    } finally {
      stoveData.setLoading(false);
    }
  };

  const handleShutdown = async () => {
    stoveData.setLoadingMessage('Spegnimento stufa...');
    stoveData.setLoading(true);
    try {
      const response = await shutdownCmd.execute(STOVE_ROUTES.shutdown, {
        method: 'POST',
        body: JSON.stringify({ source: 'manual' }),
      });
      if (response) {
        if (!response.ok) {
          if (response.status === 409) throw new Error('Command not allowed in current state');
          throw new Error(`Command failed: ${response.status}`);
        }
        const data = await response.json() as ThermorossiCommandResponse;
        await logStoveAction.shutdown();
        const delayMs = (data.suggested_poll_delay_s ?? 15) * 1000;
        await new Promise<void>(resolve => setTimeout(resolve, delayMs));
        await stoveData.fetchStatusAndUpdate();
      }
      // If response is null, request was deduplicated (silently blocked)
    } finally {
      stoveData.setLoading(false);
    }
  };

  const handleFanChange = async (e: React.ChangeEvent<HTMLInputElement> | { target: { value: string } }) => {
    const level = Number(e.target.value);
    stoveData.setLoadingMessage('Modifica livello ventola...');
    stoveData.setLoading(true);
    try {
      const response = await setFanCmd.execute(STOVE_ROUTES.setFan, {
        method: 'POST',
        body: JSON.stringify({ level, source: 'manual' }),
      });
      if (response) {
        if (!response.ok) {
          if (response.status === 409) throw new Error('Command not allowed in current state');
          throw new Error(`Command failed: ${response.status}`);
        }
        const data = await response.json() as ThermorossiCommandResponse;
        await logStoveAction.setFan(level);
        const delayMs = (data.suggested_poll_delay_s ?? 5) * 1000;
        await new Promise<void>(resolve => setTimeout(resolve, delayMs));
        await stoveData.fetchStatusAndUpdate();
      }
      // If response is null, request was deduplicated (silently blocked)
    } finally {
      stoveData.setLoading(false);
    }
  };

  const handlePowerChange = async (e: React.ChangeEvent<HTMLInputElement> | { target: { value: string } }) => {
    const level = Number(e.target.value);
    stoveData.setLoadingMessage('Modifica livello potenza...');
    stoveData.setLoading(true);
    try {
      const response = await setPowerCmd.execute(STOVE_ROUTES.setPower, {
        method: 'POST',
        body: JSON.stringify({ level, source: 'manual' }),
      });
      if (response) {
        if (!response.ok) {
          if (response.status === 409) throw new Error('Command not allowed in current state');
          throw new Error(`Command failed: ${response.status}`);
        }
        const data = await response.json() as ThermorossiCommandResponse;
        await logStoveAction.setPower(level);
        const delayMs = (data.suggested_poll_delay_s ?? 5) * 1000;
        await new Promise<void>(resolve => setTimeout(resolve, delayMs));
        await stoveData.fetchStatusAndUpdate();
      }
      // If response is null, request was deduplicated (silently blocked)
    } finally {
      stoveData.setLoading(false);
    }
  };

  const handleClearSemiManual = async () => {
    await clearSemiManualMode();
    await logSchedulerAction.clearSemiManual();
    stoveData.setSemiManualMode(false);
    stoveData.setReturnToAutoAt(null);

    const nextAction = await getNextScheduledAction();
    stoveData.setNextScheduledAction(nextAction);
  };

  const handleSetManualMode = async () => {
    // Use existing API: operation setSchedulerMode with enabled: false
    await fetch('/api/scheduler/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operation: 'setSchedulerMode',
        data: { enabled: false }
      })
    });
    stoveData.setSchedulerEnabled(false);
    stoveData.setSemiManualMode(false);
  };

  const handleSetAutomaticMode = async () => {
    // Use existing API: operation clearSemiManualMode then setSchedulerMode
    await fetch('/api/scheduler/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operation: 'setSchedulerMode',
        data: { enabled: true }
      })
    });
    // Clear semi-manual if active
    if (stoveData.semiManualMode) {
      await fetch('/api/scheduler/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'clearSemiManualMode',
          data: {}
        })
      });
    }
    stoveData.setSchedulerEnabled(true);
    stoveData.setSemiManualMode(false);
    const nextAction = await getNextScheduledAction();
    stoveData.setNextScheduledAction(nextAction);
  };

  const handleConfirmCleaning = async () => {
    stoveData.setCleaningInProgress(true);
    try {
      await confirmCleaning(user);
      await stoveData.fetchMaintenanceStatus();
    } catch (err) {
      console.error('Errore conferma pulizia:', err);
    } finally {
      stoveData.setCleaningInProgress(false);
    }
  };

  const handleManualRefresh = async () => {
    stoveData.setLoading(true);
    await stoveData.fetchStatusAndUpdate();
    stoveData.setLoading(false);
  };

  return {
    // Command handlers
    handleIgnite,
    handleShutdown,
    handleFanChange,
    handlePowerChange,
    handleClearSemiManual,
    handleSetManualMode,
    handleSetAutomaticMode,
    handleConfirmCleaning,
    handleManualRefresh,

    // Retryable command objects
    igniteCmd,
    shutdownCmd,
    setFanCmd,
    setPowerCmd,
  };
}
