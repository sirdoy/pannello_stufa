'use client';

import { useState } from 'react';
import { useAdaptivePolling } from '@/lib/hooks/useAdaptivePolling';
import { useVisibility } from '@/lib/hooks/useVisibility';

export interface DhcpReservation {
  ip: string;
  name: string;
  mac: string;
  interface_type: string;
  address_source: string;
}

export interface PortForwardingRule {
  external_port: number;
  internal_port: number;
  protocol: 'TCP' | 'UDP';
  internal_client: string;
  enabled: boolean;
  description: string;
  lease_duration: number;
}

export interface UpnpStatus {
  enabled: boolean;
  upnp_ports: PortForwardingRule[];
  is_stale: boolean;
  fetched_at: string | null;
}

export interface MeshNode {
  uid: string;
  name: string;
  model: string;
  mac: string;
  vendor: string;
  is_meshed: boolean;
  device_category: string;
}

export interface MeshLink {
  source_uid: string;
  source_name: string;
  target_uid: string;
  target_name: string;
  type: string | null;
  state: string | null;
  cur_rx_kbps: number | null;
  cur_tx_kbps: number | null;
  max_rx_kbps: number | null;
  max_tx_kbps: number | null;
}

export interface MeshTopology {
  schema_version: string | null;
  node_count: number;
  link_count: number;
  nodes: MeshNode[];
  links: MeshLink[];
  is_stale: boolean;
  fetched_at: string | null;
}

interface UseFritzNetworkServicesOptions {
  paused?: boolean;
}

/**
 * useFritzNetworkServices
 *
 * Fetches all 4 network service endpoints in parallel using Promise.allSettled.
 * Partial failures are tolerated — successful responses still update their respective state.
 * Supports pausing (when tab/card is not visible).
 *
 * @param options.paused - When true, stops polling
 * @returns { dhcp, portForwarding, upnp, mesh, loading, stale }
 */
export function useFritzNetworkServices(options: UseFritzNetworkServicesOptions = {}): {
  dhcp: { items: DhcpReservation[]; total: number } | null;
  portForwarding: { items: PortForwardingRule[]; total: number } | null;
  upnp: UpnpStatus | null;
  mesh: MeshTopology | null;
  loading: boolean;
  stale: boolean;
} {
  const { paused = false } = options;

  const [dhcp, setDhcp] = useState<{ items: DhcpReservation[]; total: number } | null>(null);
  const [portForwarding, setPortForwarding] = useState<{ items: PortForwardingRule[]; total: number } | null>(null);
  const [upnp, setUpnp] = useState<UpnpStatus | null>(null);
  const [mesh, setMesh] = useState<MeshTopology | null>(null);
  const [loading, setLoading] = useState(true);
  const [stale, setStale] = useState(false);

  const isVisible = useVisibility();
  const interval = paused ? null : (isVisible ? 60000 : 300000);

  const fetchData = async () => {
    try {
      const results = await Promise.allSettled([
        fetch('/api/fritzbox/network/dhcp/reservations?limit=1000'),
        fetch('/api/fritzbox/network/port-forwarding?limit=1000'),
        fetch('/api/fritzbox/network/upnp'),
        fetch('/api/fritzbox/network/mesh'),
      ]);

      let hasError = false;

      const [dhcpResult, portFwdResult, upnpResult, meshResult] = results;

      if (dhcpResult.status === 'fulfilled' && dhcpResult.value.ok) {
        const json = await dhcpResult.value.json() as { reservations: { items: DhcpReservation[]; total: number } };
        setDhcp(json.reservations);
      } else {
        hasError = true;
      }

      if (portFwdResult.status === 'fulfilled' && portFwdResult.value.ok) {
        const json = await portFwdResult.value.json() as { portForwarding: { items: PortForwardingRule[]; total: number } };
        setPortForwarding(json.portForwarding);
      } else {
        hasError = true;
      }

      if (upnpResult.status === 'fulfilled' && upnpResult.value.ok) {
        const json = await upnpResult.value.json() as { upnp: UpnpStatus };
        setUpnp(json.upnp);
      } else {
        hasError = true;
      }

      if (meshResult.status === 'fulfilled' && meshResult.value.ok) {
        const json = await meshResult.value.json() as { mesh: MeshTopology };
        setMesh(json.mesh);
      } else {
        hasError = true;
      }

      setStale(hasError);
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

  return { dhcp, portForwarding, upnp, mesh, loading, stale };
}
