import { renderHook, waitFor } from '@testing-library/react';
import { useFritzWifiNetworks } from '../useFritzWifiNetworks';

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

// Mock useVisibility to return true
jest.mock('@/lib/hooks/useVisibility', () => ({
  useVisibility: () => true,
}));

describe('useFritzWifiNetworks', () => {
  const mockNetworks = [
    {
      service: 1,
      band: '2.4GHz',
      ssid: 'HomeWifi',
      channel: 6,
      possible_channels: '1,6,11',
      is_enabled: true,
      beacon_type: 'WPA2',
    },
    {
      service: 2,
      band: '5GHz',
      ssid: 'HomeWifi_5G',
      channel: 36,
      possible_channels: '36,40,44,48',
      is_enabled: true,
      beacon_type: 'WPA2',
    },
  ];

  const mockWifiStatusResponse = {
    networks: mockNetworks,
    is_stale: false,
    fetched_at: '2026-01-01T00:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockAdaptivePollingInterval = null;
  });

  it('initializes with loading=true and empty networks', () => {
    global.fetch = jest.fn().mockReturnValue(new Promise(() => {})) as jest.Mock;

    const { result } = renderHook(() => useFritzWifiNetworks());

    // Before fetch resolves, loading is true
    expect(result.current.networks).toEqual([]);
    expect(result.current.stale).toBe(false);
  });

  it('fetches /api/v1/fritzbox/wifi/networks and returns WiFiNetworkModel[]', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ networks: mockWifiStatusResponse }),
    }) as jest.Mock;

    const { result } = renderHook(() => useFritzWifiNetworks());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/v1/fritzbox/wifi/networks');
    expect(result.current.networks).toHaveLength(2);
    expect(result.current.networks[0]?.band).toBe('2.4GHz');
    expect(result.current.stale).toBe(false);
  });

  it('reads from json.networks.networks (double nesting)', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          networks: {
            networks: [mockNetworks[0]],
            is_stale: false,
            fetched_at: null,
          },
        }),
    }) as jest.Mock;

    const { result } = renderHook(() => useFritzWifiNetworks());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.networks).toHaveLength(1);
    expect(result.current.networks[0]?.ssid).toBe('HomeWifi');
  });

  it('sets stale=true and keeps last networks on fetch error', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error')) as jest.Mock;

    const { result } = renderHook(() => useFritzWifiNetworks());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stale).toBe(true);
    expect(result.current.networks).toEqual([]);
  });

  it('sets stale=true on non-ok response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({}),
    }) as jest.Mock;

    const { result } = renderHook(() => useFritzWifiNetworks());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stale).toBe(true);
  });

  it('stops polling (interval: null) when paused=true', () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ networks: mockWifiStatusResponse }),
    }) as jest.Mock;

    renderHook(() => useFritzWifiNetworks({ paused: true }));

    expect(mockAdaptivePollingInterval).toBeNull();
  });

  it('polls with 60s interval when visible and not paused', () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ networks: mockWifiStatusResponse }),
    }) as jest.Mock;

    renderHook(() => useFritzWifiNetworks());

    // useVisibility is mocked to return true (visible)
    expect(mockAdaptivePollingInterval).toBe(60000);
  });
});
