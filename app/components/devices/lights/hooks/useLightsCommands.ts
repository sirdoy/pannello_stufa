/**
 * useLightsCommands Hook
 *
 * Encapsulates all Philips Hue command handlers with retry infrastructure.
 * MUST call useRetryableCommand at top level (React hooks rules).
 *
 * All commands integrate with Phase 55 retry infrastructure:
 * - Automatic retry with exponential backoff
 * - Request deduplication
 * - Idempotency key injection
 * - Persistent error toasts
 *
 * Uses v1 body format (flat keys) to match the HA proxy CLIP v1 API.
 * Commands answer with the re-polled state + data_confirmed (2 s refetch delay when unconfirmed).
 *
 * Pairing handlers removed — proxy handles Bridge connectivity.
 */

'use client';

import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { useRetryableCommand } from '@/lib/hooks/useRetryableCommand';
import type { UseLightsDataReturn } from './useLightsData';
import type { HueCommandResponse } from '@/types/hueProxy';

/**
 * Parameters required by useLightsCommands
 */
export interface UseLightsCommandsParams {
  /** State setters and fetch functions from useLightsData */
  lightsData: Pick<
    UseLightsDataReturn,
    | 'setRefreshing'
    | 'setLoadingMessage'
    | 'setError'
    | 'fetchData'
    | 'groups'
    | 'checkConnection'
    | 'connected'
  >;
  /** Next.js router for navigation */
  router: AppRouterInstance;
}

/**
 * Command handlers and retryable command objects
 */
export interface UseLightsCommandsReturn {
  handleRoomToggle: (groupId: string | null | undefined, on: boolean) => Promise<void>;
  handleLightToggle: (lightId: string, on: boolean) => Promise<void>;
  handleBrightnessChange: (groupId: string | null | undefined, brightness: string) => Promise<void>;
  handleSceneActivate: (sceneId: string, groupId: string) => Promise<void>;
  handleAllLightsToggle: (on: boolean) => Promise<void>;

  // Retry command objects (for error banners)
  hueRoomCmd: ReturnType<typeof useRetryableCommand>;
  hueLightCmd: ReturnType<typeof useRetryableCommand>;
  hueSceneCmd: ReturnType<typeof useRetryableCommand>;
}

/**
 * Custom hook for lights command execution
 *
 * Integrates with useRetryableCommand for room/scene commands.
 * Handlers update UI state for immediate feedback.
 * All commands wait 2 s before refetching only when data_confirmed is false.
 *
 * @param params - Configuration parameters
 * @returns Command handlers and retryable command objects
 */
export function useLightsCommands(params: UseLightsCommandsParams): UseLightsCommandsReturn {
  const { lightsData } = params;

  // Retry infrastructure - one hook per command type (React hooks rules)
  const hueRoomCmd = useRetryableCommand({ device: 'hue', action: 'room' });
  const hueLightCmd = useRetryableCommand({ device: 'hue', action: 'light' });
  const hueSceneCmd = useRetryableCommand({ device: 'hue', action: 'scene' });

  /**
   * Toggle a room/group on or off
   * Sends v1 flat body: { on: true } (NOT { on: { on: true } })
   */
  const handleRoomToggle = async (groupId: string | null | undefined, on: boolean) => {
    try {
      lightsData.setLoadingMessage(on ? 'Accensione luci...' : 'Spegnimento luci...');
      lightsData.setRefreshing(true);
      lightsData.setError(null);
      const response = await hueRoomCmd.execute(`/api/v1/hue/groups/${groupId}/action`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ on }),  // v1 flat: { on: true }, NOT { on: { on: true } }
      });
      if (response) {
        if (!response.ok) {
          if (response.status === 409) throw new Error('Luce non raggiungibile');
          throw new Error(`Comando fallito: ${response.status}`);
        }
        const data = await response.json() as HueCommandResponse;
        // Backend re-polled before answering: no wait when the new state is confirmed.
        const delayMs = data.data_confirmed ? 0 : 2000;
        await new Promise<void>(resolve => setTimeout(resolve, delayMs));
        await lightsData.fetchData();
      }
      // If response is null, request was deduplicated (silently blocked)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      lightsData.setError(message);
    } finally {
      lightsData.setRefreshing(false);
    }
  };

  /**
   * Toggle a single light on or off
   * PUT /api/v1/hue/lights/{lightId}/state with v1 flat body: { on: true }
   */
  const handleLightToggle = async (lightId: string, on: boolean) => {
    try {
      lightsData.setLoadingMessage(on ? 'Accensione luce...' : 'Spegnimento luce...');
      lightsData.setRefreshing(true);
      lightsData.setError(null);
      const response = await hueLightCmd.execute(`/api/v1/hue/lights/${lightId}/state`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ on }),
      });
      if (response) {
        if (!response.ok) {
          if (response.status === 409) throw new Error('Luce non raggiungibile');
          throw new Error(`Comando fallito: ${response.status}`);
        }
        const data = await response.json() as HueCommandResponse;
        // Backend re-polled before answering: no wait when the new state is confirmed.
        const delayMs = data.data_confirmed ? 0 : 2000;
        await new Promise<void>(resolve => setTimeout(resolve, delayMs));
        await lightsData.fetchData();
      }
      // If response is null, request was deduplicated (silently blocked)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      lightsData.setError(message);
    } finally {
      lightsData.setRefreshing(false);
    }
  };

  /**
   * Change brightness of a room/group
   * Converts percent (0-100) to bri (0-254)
   * Sends v1 flat body: { bri: 200 } (NOT { dimming: { brightness: 78 } })
   */
  const handleBrightnessChange = async (groupId: string | null | undefined, brightness: string) => {
    try {
      lightsData.setLoadingMessage('Modifica luminosita...');
      lightsData.setRefreshing(true);
      lightsData.setError(null);
      // Convert percent (0-100) to bri (0-254)
      const bri254 = Math.round(parseFloat(brightness) * 254 / 100);
      const response = await hueRoomCmd.execute(`/api/v1/hue/groups/${groupId}/action`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bri: bri254 }),  // v1 flat: { bri: 200 }, NOT { dimming: { brightness: 78 } }
      });
      if (response) {
        if (!response.ok) {
          if (response.status === 409) throw new Error('Luce non raggiungibile');
          throw new Error(`Comando fallito: ${response.status}`);
        }
        const data = await response.json() as HueCommandResponse;
        // Backend re-polled before answering: no wait when the new state is confirmed.
        const delayMs = data.data_confirmed ? 0 : 2000;
        await new Promise<void>(resolve => setTimeout(resolve, delayMs));
        await lightsData.fetchData();
      }
      // If response is null, request was deduplicated (silently blocked)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      lightsData.setError(message);
    } finally {
      lightsData.setRefreshing(false);
    }
  };

  /**
   * Activate a scene
   * POST /api/v1/hue/groups/{groupId}/scenes/{sceneId}
   */
  const handleSceneActivate = async (sceneId: string, groupId: string) => {
    try {
      lightsData.setLoadingMessage('Attivazione scena...');
      lightsData.setRefreshing(true);
      lightsData.setError(null);
      // POST /api/v1/hue/groups/{groupId}/scenes/{sceneId}
      const response = await hueSceneCmd.execute(`/api/v1/hue/groups/${groupId}/scenes/${sceneId}`, {
        method: 'POST',
      });
      if (response) {
        if (!response.ok) {
          throw new Error(`Comando fallito: ${response.status}`);
        }
        const data = await response.json() as HueCommandResponse;
        // Backend re-polled before answering: no wait when the new state is confirmed.
        const delayMs = data.data_confirmed ? 0 : 2000;
        await new Promise<void>(resolve => setTimeout(resolve, delayMs));
        await lightsData.fetchData();
      }
      // If response is null, request was deduplicated (silently blocked)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      lightsData.setError(message);
    } finally {
      lightsData.setRefreshing(false);
    }
  };

  /**
   * Toggle all lights in the house (all groups at once)
   * Iterates groups by group_id (NOT grouped_light service lookup)
   */
  const handleAllLightsToggle = async (on: boolean) => {
    try {
      lightsData.setLoadingMessage(on ? 'Accensione tutte le luci...' : 'Spegnimento tutte le luci...');
      lightsData.setRefreshing(true);
      lightsData.setError(null);
      // Iterate groups by group_id (NOT grouped_light service lookup)
      await Promise.all(
        lightsData.groups.map((group) =>
          hueRoomCmd.execute(`/api/v1/hue/groups/${group.group_id}/action`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ on }),  // v1 flat
          })
        )
      );
      // Wait before refresh (use default 2s for multi-group)
      await new Promise<void>(resolve => setTimeout(resolve, 2000));
      await lightsData.fetchData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      lightsData.setError(message);
    } finally {
      lightsData.setRefreshing(false);
    }
  };

  return {
    // Room commands
    handleRoomToggle,
    handleLightToggle,
    handleBrightnessChange,
    handleSceneActivate,
    handleAllLightsToggle,

    // Retry command objects
    hueRoomCmd,
    hueLightCmd,
    hueSceneCmd,
  };
}
