'use client';

import { useAdaptivePolling } from '@/lib/hooks/useAdaptivePolling';
import { useVisibility } from '@/lib/hooks/useVisibility';
import { useState } from 'react';

export interface WiFiNetworkModel {
  service: number;
  band: string;               // "2.4GHz", "5GHz"
  ssid: string;
  channel: number;
  possible_channels: string;
  is_enabled: boolean;
  beacon_type: string;
}

interface UseFritzWifiNetworksOptions {
  paused?: boolean;
}

/**
 * useFritzWifiNetworks
 *
 * Polls /api/v1/fritzbox/wifi/networks with optional paused flag.
 * When paused, stops polling (interval: null).
 * Adjusts poll rate based on page visibility (60s visible, 300s hidden).
 *
 * @param options.paused - When true, stops polling
 * @returns { networks, loading, stale }
 */
export function useFritzWifiNetworks(options: UseFritzWifiNetworksOptions = {}): {
  networks: WiFiNetworkModel[];
  loading: boolean;
  stale: boolean;
} {
  const { paused = false } = options;

  const [networks, setNetworks] = useState<WiFiNetworkModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [stale, setStale] = useState(false);

  const isVisible = useVisibility();
  const interval = paused ? null : (isVisible ? 60000 : 300000);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/v1/fritzbox/wifi/networks');
      if (!res.ok) {
        setStale(true);
        return;
      }
      // Response: { networks: WiFiStatusResponse }
      // WiFiStatusResponse: { networks: WiFiNetworkModel[], is_stale, fetched_at }
      // So array is at json.networks.networks (double nesting)
      const json = await res.json() as { networks: { networks: WiFiNetworkModel[]; is_stale: boolean; fetched_at: string | null } };
      setNetworks(json.networks.networks);
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

  return { networks, loading, stale };
}
