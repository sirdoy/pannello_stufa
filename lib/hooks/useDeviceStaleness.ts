/**
 * useDeviceStaleness Hook
 *
 * React hook for real-time device staleness monitoring.
 * Polls every 5 seconds to update staleness information.
 * Pauses polling when tab is hidden (non-critical monitoring).
 *
 * @module useDeviceStaleness
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { getDeviceStaleness, type StalenessInfo } from '@/lib/pwa/stalenessDetector';
import { useVisibility } from './useVisibility';

/**
 * Hook for monitoring device data staleness
 *
 * Provides real-time staleness information that updates every 5 seconds.
 * Returns null initially until first fetch completes.
 *
 * @param deviceId - Device ID to monitor
 * @returns Staleness info or null if not yet loaded
 *
 * @example
 * function DeviceCard({ deviceId }) {
 *   const staleness = useDeviceStaleness(deviceId);
 *
 *   if (!staleness) return <Spinner />;
 *
 *   return (
 *     <div>
 *       {staleness.isStale && (
 *         <Warning>Data is {staleness.ageSeconds}s old</Warning>
 *       )}
 *     </div>
 *   );
 * }
 */
export function useDeviceStaleness(deviceId: string): StalenessInfo | null {
  const [staleness, setStaleness] = useState<StalenessInfo | null>(null);
  const isVisible = useVisibility();

  const fetchStaleness = useCallback(async () => {
    try {
      const info = await getDeviceStaleness(deviceId);
      setStaleness(info);
    } catch (error) {
      console.error(`[useDeviceStaleness] Error fetching staleness for ${deviceId}:`, error);
      // Keep previous state on error, don't set to null
    }
  }, [deviceId]);

  useEffect(() => {
    // Don't poll when tab is hidden (staleness display is non-critical)
    if (!isVisible) return;

    // Fetch immediately when becoming visible
    fetchStaleness();

    // Poll every 5 seconds while visible
    const intervalId = setInterval(fetchStaleness, 5000);

    return () => {
      clearInterval(intervalId);
    };
  }, [deviceId, isVisible, fetchStaleness]);

  return staleness;
}
