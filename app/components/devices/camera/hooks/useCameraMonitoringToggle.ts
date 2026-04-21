'use client';

import { useState, useCallback } from 'react';
import { CAMERA_ROUTES } from '@/lib/routes';

/**
 * Shared hook for the Netatmo camera monitoring toggle.
 *
 * Encapsulates the optimistic-update + rollback logic used by both
 * CameraCard (homepage summary) and CameraDashboard (dedicated /camera page),
 * so the behavior is exercised by tests via `renderHook` rather than a
 * parallel reimplementation.
 *
 * Behavior:
 * - Optimistically updates `monitoringOn` immediately on toggle.
 * - Issues `POST /api/v1/netatmo/camera/:cameraId/monitoring` with body
 *   `{ monitoring: 'on' | 'off' }`.
 * - Rolls back on non-OK response or fetch rejection.
 * - Prevents concurrent toggles while a request is in flight.
 * - Respects the `disabled` flag (e.g. stale data) by refusing to toggle.
 */
export interface UseCameraMonitoringToggleOptions {
  /** Initial monitoring state (true = 'on'). */
  initialOn?: boolean;
  /** When true, the toggle is a no-op (used for stale/unreachable data). */
  disabled?: boolean;
}

export interface UseCameraMonitoringToggleReturn {
  monitoringOn: boolean;
  monitoringLoading: boolean;
  /** Explicitly sync the `monitoringOn` state from an external source (e.g. polling). */
  setMonitoringOn: (value: boolean) => void;
  /** Trigger the toggle. `cameraId` is required at call-time so the same hook works with a
   *  single-selection card or a per-row dashboard. */
  handleToggle: (cameraId: string | null | undefined, newValue: boolean) => Promise<void>;
}

export function useCameraMonitoringToggle(
  options: UseCameraMonitoringToggleOptions = {},
): UseCameraMonitoringToggleReturn {
  const { initialOn = false, disabled = false } = options;

  const [monitoringOn, setMonitoringOn] = useState<boolean>(initialOn);
  const [monitoringLoading, setMonitoringLoading] = useState<boolean>(false);

  const handleToggle = useCallback(
    async (cameraId: string | null | undefined, newValue: boolean): Promise<void> => {
      if (!cameraId) return;
      if (monitoringLoading) return;
      if (disabled) return;

      const previousValue = monitoringOn;
      setMonitoringOn(newValue); // optimistic
      setMonitoringLoading(true);
      try {
        const res = await fetch(CAMERA_ROUTES.monitoring(cameraId), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            monitoring: newValue ? 'on' : 'off',
          }),
        });
        if (!res.ok) {
          setMonitoringOn(previousValue); // rollback
        }
      } catch {
        setMonitoringOn(previousValue); // rollback
      } finally {
        setMonitoringLoading(false);
      }
    },
    [monitoringOn, monitoringLoading, disabled],
  );

  return {
    monitoringOn,
    monitoringLoading,
    setMonitoringOn,
    handleToggle,
  };
}

export default useCameraMonitoringToggle;
