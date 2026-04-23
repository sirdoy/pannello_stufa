'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * TR-064 service entry returned by /api/fritzbox/service-discovery.
 * Shape mirrors lib/fritzbox/fritzboxClient.ts:561-565.
 */
export interface ServiceEntry {
  name: string;
  type: string;
  url: string;
}

interface UseFritzServiceDiscoveryReturn {
  services: ServiceEntry[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

/**
 * useFritzServiceDiscovery (FRITZ-07)
 *
 * Manual-refresh hook (no polling per D-15). Fetches the TR-064 service descriptor
 * once on mount, then exposes a `refresh()` callback for the UI's refresh button.
 */
export function useFritzServiceDiscovery(): UseFritzServiceDiscoveryReturn {
  const [services, setServices] = useState<ServiceEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/fritzbox/service-discovery');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as { discovery: { services: ServiceEntry[] } };
      setServices(json.discovery.services ?? []);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { services, loading, error, refresh };
}
