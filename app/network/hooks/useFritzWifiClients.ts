'use client';

import { useState, useEffect, useRef } from 'react';
import { useAdaptivePolling } from '@/lib/hooks/useAdaptivePolling';
import { useVisibility } from '@/lib/hooks/useVisibility';

export interface WiFiClient {
  hostname: string;
  mac: string;
  ip: string;
  band: string;               // "2.4GHz" or "5GHz"
  ssid: string;
  signal_strength: number;    // dBm (negative integer)
  link_speed_mbps: number;
  is_active: boolean;
}

export type WifiBandFilter = 'all' | '2.4GHz' | '5GHz';

interface UseFritzWifiClientsOptions {
  paused?: boolean;
}

/**
 * useFritzWifiClients
 *
 * Polls /api/fritzbox/wifi/clients with optional band filter.
 * Supports pausing (when tab/card is not visible) via paused prop.
 * Re-fetches when band changes without waiting for next poll interval.
 *
 * @param options.paused - When true, stops polling (interval: null)
 * @returns { clients, loading, stale, band, setBand, total }
 */
export function useFritzWifiClients(options: UseFritzWifiClientsOptions = {}): {
  clients: WiFiClient[];
  loading: boolean;
  stale: boolean;
  band: WifiBandFilter;
  setBand: (band: WifiBandFilter) => void;
  total: number;
} {
  const { paused = false } = options;

  const [clients, setClients] = useState<WiFiClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [stale, setStale] = useState(false);
  const [band, setBand] = useState<WifiBandFilter>('all');
  const [total, setTotal] = useState(0);

  const isVisible = useVisibility();
  const interval = paused ? null : (isVisible ? 60000 : 300000);

  const fetchData = async () => {
    try {
      const params = new URLSearchParams();
      if (band !== 'all') {
        params.set('band', band);
      }
      params.set('limit', '1000');

      const res = await fetch(`/api/fritzbox/wifi/clients?${params.toString()}`);
      if (!res.ok) {
        setStale(true);
        return;
      }
      const json = await res.json() as { clients: { items: WiFiClient[]; total: number } };
      setClients(json.clients.items);
      setTotal(json.clients.total);
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

  // Re-fetch when band changes (skip first render since immediate: true already fetches)
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    void fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [band]);

  return { clients, loading, stale, band, setBand, total };
}
