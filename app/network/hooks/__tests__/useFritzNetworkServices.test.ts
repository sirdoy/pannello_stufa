import { renderHook, waitFor } from '@testing-library/react';
import { useFritzNetworkServices } from '../useFritzNetworkServices';

let mockAdaptivePollingInterval: number | null = null;

// Mock useAdaptivePolling to capture interval and call callback immediately
jest.mock('@/lib/hooks/useAdaptivePolling', () => ({
  useAdaptivePolling: ({ callback, interval }: { callback: () => void; interval: number | null }) => {
    mockAdaptivePollingInterval = interval;
    if (interval !== null) {
      callback();
    }
  },
}));

// Mock useVisibility
jest.mock('@/lib/hooks/useVisibility', () => ({
  useVisibility: () => true,
}));

describe('useFritzNetworkServices', () => {
  const mockDhcp = {
    reservations: {
      items: [
        { ip: '192.168.1.10', name: 'server', mac: 'AA:BB:CC:DD:EE:01', interface_type: 'LAN', address_source: 'Static' },
      ],
      total: 1,
    },
  };

  const mockPortForwarding = {
    portForwarding: {
      items: [
        { external_port: 80, internal_port: 8080, protocol: 'TCP', internal_client: '192.168.1.10', enabled: true, description: 'Web', lease_duration: 0 },
      ],
      total: 1,
    },
  };

  const mockUpnp = {
    upnp: {
      enabled: true,
      upnp_ports: [],
      is_stale: false,
      fetched_at: null,
    },
  };

  const mockMesh = {
    mesh: {
      schema_version: null,
      node_count: 1,
      link_count: 0,
      nodes: [{ uid: 'node1', name: 'Fritz!Box 7590', model: '7590', mac: 'AA:BB:CC:DD:EE:FF', vendor: 'AVM', is_meshed: false, device_category: 'router' }],
      links: [],
      is_stale: false,
      fetched_at: null,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockAdaptivePollingInterval = null;
  });

  it('calls Promise.allSettled with all 4 URLs', async () => {
    const fetchSpy = jest.fn()
      .mockResolvedValue({ ok: true, json: () => Promise.resolve(mockDhcp) });
    global.fetch = fetchSpy as jest.Mock;

    const { result } = renderHook(() => useFritzNetworkServices());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const urls = fetchSpy.mock.calls.map((call: unknown[]) => call[0] as string);
    expect(urls).toContain('/api/fritzbox/network/dhcp/reservations?limit=1000');
    expect(urls).toContain('/api/fritzbox/network/port-forwarding?limit=1000');
    expect(urls).toContain('/api/fritzbox/network/upnp');
    expect(urls).toContain('/api/fritzbox/network/mesh');
  });

  it('parses json.reservations for DHCP data', async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockDhcp) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockPortForwarding) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockUpnp) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockMesh) }) as jest.Mock;

    const { result } = renderHook(() => useFritzNetworkServices());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.dhcp).toEqual(mockDhcp.reservations);
    expect(result.current.portForwarding).toEqual(mockPortForwarding.portForwarding);
    expect(result.current.upnp).toEqual(mockUpnp.upnp);
    expect(result.current.mesh).toEqual(mockMesh.mesh);
  });

  it('tolerates partial failures — still sets successful results', async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockDhcp) })
      .mockRejectedValueOnce(new Error('Port forwarding failed'))
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockUpnp) })
      .mockRejectedValueOnce(new Error('Mesh failed')) as jest.Mock;

    const { result } = renderHook(() => useFritzNetworkServices());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.dhcp).toEqual(mockDhcp.reservations);
    expect(result.current.portForwarding).toBeNull(); // failed
    expect(result.current.upnp).toEqual(mockUpnp.upnp);
    expect(result.current.mesh).toBeNull(); // failed
    expect(result.current.stale).toBe(true); // partial failure -> stale
  });

  it('stops polling when paused', () => {
    global.fetch = jest.fn() as jest.Mock;

    renderHook(() => useFritzNetworkServices({ paused: true }));

    expect(mockAdaptivePollingInterval).toBeNull();
  });
});
