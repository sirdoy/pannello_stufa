'use client';

import { useState } from 'react';
import { useAdaptivePolling } from '@/lib/hooks/useAdaptivePolling';
import { useVisibility } from '@/lib/hooks/useVisibility';

export interface SystemInfoData {
  model: string;
  firmware_version: string;
  update_available: string;       // non-empty string = update available
  device_uptime_seconds: number;
  device_uptime_formatted: string;
  is_stale: boolean;
  fetched_at: string | null;
}

/**
 * useFritzSystemInfo
 *
 * Polls /api/fritzbox/system for Fritz!Box system information.
 * Adapts polling interval based on tab visibility (60s visible, 300s hidden).
 *
 * @returns { data, loading, stale }
 */
export function useFritzSystemInfo(): {
  data: SystemInfoData | null;
  loading: boolean;
  stale: boolean;
} {
  const [data, setData] = useState<SystemInfoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [stale, setStale] = useState(false);

  const isVisible = useVisibility();
  const interval = isVisible ? 60000 : 300000;

  const fetchData = async () => {
    try {
      const res = await fetch('/api/fritzbox/system');
      if (!res.ok) {
        setStale(true);
        return;
      }
      const json = await res.json() as { system: SystemInfoData };
      setData(json.system);
      setStale(false);
    } catch {
      setStale(true);
    } finally {
      setLoading(false);
    }
  };

  useAdaptivePolling({
    callback: fetchData,
    interval,
    alwaysActive: false,
    immediate: true,
    initialDelay: 0,
  });

  return { data, loading, stale };
}
