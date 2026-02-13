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
 * Pairing commands don't use retry (discovery/pair are one-shot operations).
 */

'use client';

import { useCallback } from 'react';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { useRetryableCommand } from '@/lib/hooks/useRetryableCommand';
import type { UseLightsDataReturn } from './useLightsData';

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
    | 'rooms'
    | 'setPairing'
    | 'setPairingStep'
    | 'setDiscoveredBridges'
    | 'setSelectedBridge'
    | 'setPairingCountdown'
    | 'setPairingError'
    | 'pairingTimerRef'
    | 'selectedBridge'
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
  // Room commands
  handleRoomToggle: (roomId: string | null | undefined, on: boolean) => Promise<void>;
  handleBrightnessChange: (roomId: string | null | undefined, brightness: string) => Promise<void>;
  handleSceneActivate: (sceneId: string) => Promise<void>;
  handleAllLightsToggle: (on: boolean) => Promise<void>;

  // Remote/Pairing commands
  handleRemoteAuth: () => void;
  handleDisconnectRemote: () => Promise<void>;
  handleStartPairing: () => Promise<void>;
  handlePairWithBridge: (bridge: any) => Promise<void>;
  handleConfirmButtonPressed: () => void;
  handleSelectBridge: (bridge: any) => void;
  handleRetryPairing: () => void;
  handleCancelPairing: () => void;

  // Retry command objects (for error banners)
  hueRoomCmd: ReturnType<typeof useRetryableCommand>;
  hueSceneCmd: ReturnType<typeof useRetryableCommand>;
}

/**
 * Custom hook for lights command execution
 *
 * Integrates with useRetryableCommand for room/scene commands.
 * Handlers update UI state for immediate feedback.
 *
 * @param params - Configuration parameters
 * @returns Command handlers and retryable command objects
 */
export function useLightsCommands(params: UseLightsCommandsParams): UseLightsCommandsReturn {
  const { lightsData, router } = params;

  // Retry infrastructure - one hook per command type (React hooks rules)
  const hueRoomCmd = useRetryableCommand({ device: 'hue', action: 'room' });
  const hueSceneCmd = useRetryableCommand({ device: 'hue', action: 'scene' });

  // Room toggle command
  const handleRoomToggle = useCallback(
    async (roomId: string | null | undefined, on: boolean) => {
      try {
        lightsData.setLoadingMessage(on ? 'Accensione luci...' : 'Spegnimento luci...');
        lightsData.setRefreshing(true);
        lightsData.setError(null);

        const response = await hueRoomCmd.execute(`/api/hue/rooms/${roomId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ on: { on } }),
        });

        if (response) {
          const data = await response.json() as { error?: string };
          if (data.error) throw new Error(data.error);
          await lightsData.fetchData();
        }
        // If response is null, request was deduplicated (silently blocked)
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        lightsData.setError(message);
      } finally {
        lightsData.setRefreshing(false);
      }
    },
    [hueRoomCmd, lightsData]
  );

  // Brightness change command
  const handleBrightnessChange = useCallback(
    async (roomId: string | null | undefined, brightness: string) => {
      try {
        lightsData.setLoadingMessage('Modifica luminosità...');
        lightsData.setRefreshing(true);
        lightsData.setError(null);

        const response = await hueRoomCmd.execute(`/api/hue/rooms/${roomId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dimming: { brightness: parseFloat(brightness) }
          }),
        });

        if (response) {
          const data = await response.json() as { error?: string };
          if (data.error) throw new Error(data.error);
          await lightsData.fetchData();
        }
        // If response is null, request was deduplicated (silently blocked)
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        lightsData.setError(message);
      } finally {
        lightsData.setRefreshing(false);
      }
    },
    [hueRoomCmd, lightsData]
  );

  // Scene activation command
  const handleSceneActivate = useCallback(
    async (sceneId: string) => {
      try {
        lightsData.setLoadingMessage('Attivazione scena...');
        lightsData.setRefreshing(true);
        lightsData.setError(null);

        const response = await hueSceneCmd.execute(`/api/hue/scenes/${sceneId}/activate`, {
          method: 'PUT',
        });

        if (response) {
          const data = await response.json() as { error?: string };
          if (data.error) throw new Error(data.error);
          await lightsData.fetchData();
        }
        // If response is null, request was deduplicated (silently blocked)
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        lightsData.setError(message);
      } finally {
        lightsData.setRefreshing(false);
      }
    },
    [hueSceneCmd, lightsData]
  );

  /**
   * Toggle all lights in the house (all rooms at once)
   */
  const handleAllLightsToggle = useCallback(
    async (on: boolean) => {
      try {
        lightsData.setLoadingMessage(on ? 'Accensione tutte le luci...' : 'Spegnimento tutte le luci...');
        lightsData.setRefreshing(true);
        lightsData.setError(null);

        // Get all grouped_light IDs from all rooms
        const groupedLightIds = lightsData.rooms
          .map((room: any) => room.services?.find((s: any) => s.rtype === 'grouped_light')?.rid)
          .filter(Boolean);

        // Toggle all rooms in parallel using retry infrastructure
        await Promise.all(
          groupedLightIds.map((groupId: string) =>
            hueRoomCmd.execute(`/api/hue/rooms/${groupId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ on: { on } }),
            })
          )
        );

        // Refresh data after all commands
        await lightsData.fetchData();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        lightsData.setError(message);
      } finally {
        lightsData.setRefreshing(false);
      }
    },
    [hueRoomCmd, lightsData]
  );

  /**
   * Remote API OAuth Flow
   * Redirects to /api/hue/remote/authorize which handles OAuth
   */
  const handleRemoteAuth = useCallback(() => {
    lightsData.setPairingError(null);
    lightsData.setError(null);
    // Redirect to our authorize endpoint (it will handle OAuth redirect to Philips)
    window.location.href = '/api/hue/remote/authorize';
  }, [lightsData]);

  /**
   * Disconnect remote access
   */
  const handleDisconnectRemote = useCallback(async () => {
    try {
      lightsData.setRefreshing(true);
      lightsData.setError(null);

      const response = await fetch('/api/hue/remote/disconnect', {
        method: 'POST',
      });

      const data = await response.json() as { error?: string };

      if (data.error) {
        throw new Error(data.error);
      }

      // Refresh connection status
      await lightsData.checkConnection();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('Disconnect error:', err);
      lightsData.setError(message);
    } finally {
      lightsData.setRefreshing(false);
    }
  }, [lightsData]);

  /**
   * Local API Pairing Flow
   * Step 1: Discover bridges
   */
  const handleStartPairing = useCallback(async () => {
    try {
      lightsData.setPairing(true);
      lightsData.setPairingStep('discovering');
      lightsData.setPairingError(null);
      lightsData.setError(null);

      const response = await fetch('/api/hue/discover');

      // Check for HTTP errors before parsing JSON
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Errore HTTP ${response.status}`;
        try {
          const errorData = JSON.parse(errorText) as { error?: string };
          errorMessage = errorData.error || errorMessage;
        } catch {
          // Could not parse JSON, use status-based message
          if (response.status === 401) {
            errorMessage = 'Sessione scaduta. Ricarica la pagina.';
          }
        }
        throw new Error(errorMessage);
      }

      const data = await response.json() as { bridges?: any[]; error?: string };

      if (data.error) {
        throw new Error(data.error);
      }

      if (!data.bridges || data.bridges.length === 0) {
        // No local bridges found - offer remote option
        lightsData.setPairingStep('noLocalBridge');
        return;
      }

      lightsData.setDiscoveredBridges(data.bridges);

      // Auto-select if only one bridge, show instructions
      if (data.bridges.length === 1) {
        lightsData.setSelectedBridge(data.bridges[0]);
        lightsData.setPairingStep('waitingForButtonPress');
      } else {
        lightsData.setPairingStep('selectBridge');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('Discovery error:', err);
      lightsData.setPairingError(message || 'Errore durante la ricerca del bridge');
      lightsData.setPairing(false);
    }
  }, [lightsData]);

  /**
   * Step 2: Pair with selected bridge (requires button press)
   */
  const handlePairWithBridge = useCallback(
    async (bridge: any) => {
      try {
        lightsData.setPairingStep('pairing');
        lightsData.setPairingError(null);
        lightsData.setPairingCountdown(30);

        // Start countdown timer
        lightsData.pairingTimerRef.current = setInterval(() => {
          lightsData.setPairingCountdown((prev: number) => {
            if (prev <= 1) {
              if (lightsData.pairingTimerRef.current) clearInterval(lightsData.pairingTimerRef.current);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        // Attempt pairing
        const response = await fetch('/api/hue/pair', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bridgeIp: bridge.internalipaddress,
            bridgeId: bridge.id,
          }),
        });

        const data = await response.json() as { error?: string; success?: boolean };

        if (lightsData.pairingTimerRef.current) {
          clearInterval(lightsData.pairingTimerRef.current);
        }

        if (data.error === 'LINK_BUTTON_NOT_PRESSED') {
          throw new Error('Pulsante bridge non premuto. Premi il pulsante sul bridge e riprova.');
        }

        if (data.error) {
          throw new Error(data.error);
        }

        if (data.success) {
          lightsData.setPairingStep('success');
          setTimeout(() => {
            lightsData.setPairing(false);
            lightsData.setPairingStep(null);
            lightsData.checkConnection();
          }, 2000);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('Pairing error:', err);
        lightsData.setPairingError(message);
        if (lightsData.pairingTimerRef.current) {
          clearInterval(lightsData.pairingTimerRef.current);
        }
      }
    },
    [lightsData]
  );

  /**
   * User confirms they pressed the bridge button - start actual pairing
   */
  const handleConfirmButtonPressed = useCallback(() => {
    if (lightsData.selectedBridge) {
      handlePairWithBridge(lightsData.selectedBridge);
    }
  }, [lightsData.selectedBridge, handlePairWithBridge]);

  /**
   * Handle bridge selection from multiple bridges
   */
  const handleSelectBridge = useCallback(
    (bridge: any) => {
      lightsData.setSelectedBridge(bridge);
      lightsData.setPairingStep('waitingForButtonPress');
    },
    [lightsData]
  );

  /**
   * Retry pairing
   */
  const handleRetryPairing = useCallback(() => {
    if (lightsData.selectedBridge) {
      // Go back to waiting for button press step
      lightsData.setPairingError(null);
      lightsData.setPairingStep('waitingForButtonPress');
    } else {
      handleStartPairing();
    }
  }, [lightsData, handleStartPairing]);

  /**
   * Cancel pairing
   */
  const handleCancelPairing = useCallback(() => {
    if (lightsData.pairingTimerRef.current) {
      clearInterval(lightsData.pairingTimerRef.current);
    }
    lightsData.setPairing(false);
    lightsData.setPairingStep(null);
    lightsData.setPairingError(null);
    lightsData.setSelectedBridge(null);
    lightsData.setDiscoveredBridges([]);
  }, [lightsData]);

  return {
    // Room commands
    handleRoomToggle,
    handleBrightnessChange,
    handleSceneActivate,
    handleAllLightsToggle,

    // Remote/Pairing commands
    handleRemoteAuth,
    handleDisconnectRemote,
    handleStartPairing,
    handlePairWithBridge,
    handleConfirmButtonPressed,
    handleSelectBridge,
    handleRetryPairing,
    handleCancelPairing,

    // Retry command objects
    hueRoomCmd,
    hueSceneCmd,
  };
}
